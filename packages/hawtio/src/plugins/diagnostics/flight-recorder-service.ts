import { ILogger, Logger } from "@hawtiosrc/core"
import { jolokiaService, MBeanNode, workspace } from "../shared"

export interface IFlightRecorderService {
  getFlightRecoderMBean(): Promise<MBeanNode | undefined>
  setUp(): Promise<any>
  startRecording(userJfrSettings?: UserJfrSettings): Promise<any>
  stopRecording(): Promise<any>
  downloadRecording(id: number, name:string): Promise<any>
}

export enum RecordingState {
    NOT_CREATED,
    CREATED,
    RECORDING,
    STOPPED,
}

export interface UserJfrSettings {
    limitType: "duration" | "maxSize" | "unlimited";
    limitValue: number;
    recordingNumber: number;
    dumpOnExit: boolean;
    name: string;
    configuration: string;
}

export type Recording = {
    number: string,
    size: string,
    file: string,
    time: any,
    canDownload: boolean,
    downloadLink: string
}

export type CurrentRecording = {
    state: RecordingState
    number?: number
}

export type JfrConfig = {
    name: string,
    label: string,
    description: string
}

class FlightRecorderService implements IFlightRecorderService {

    private jfrLogger : ILogger = Logger.get('jfr-service')

    public jfrMBean?: MBeanNode
    public jfrConfigs?: JfrConfig[]
    public userJfrSettings?: UserJfrSettings
    
    public recordings: Array<Recording> = []
    public currentRecording: CurrentRecording = {state: RecordingState.NOT_CREATED}
    public initialized: boolean = false

    async setUp() : Promise<FlightRecorderService> {

        if(!this.jfrMBean) {
            const jfr = await this.getFlightRecoderMBean()

            if (!jfr) return this;
        }

        await this.retrieveConfigurations()
        await this.retrieveRecordings()
        await this.retrieveSettings()

        this.initialized = true

        return this
    }

    async getFlightRecoderMBean() : Promise<MBeanNode | undefined> {
        if(this.jfrMBean) return this.jfrMBean

        await workspace.findMBeans('jdk.management.jfr', {type: 'FlightRecorder'}).then(
            mbeans => this.jfrMBean = mbeans[0]
        )

        return this.jfrMBean
    }

    private async retrieveConfigurations(): Promise<JfrConfig[] | undefined> {
        if (this.jfrConfigs) return this.jfrConfigs

        if (!this.jfrMBean) (await this.getFlightRecoderMBean())
        
        this.jfrConfigs = 
            ((await jolokiaService.readAttribute(this.jfrMBean?.objectName as string, "Configurations")) as Array<{name: string, label:string, description: string}> | undefined)
                ?.map(config => ({name: config.name, label: config.label, description: config.description}));
                

        return this.jfrConfigs
    }

    private async retrieveRecordings(): Promise<[Recording[], CurrentRecording, any]> {
        if (!this.jfrMBean) (await this.getFlightRecoderMBean())
        
        const jfrRecordings : Array<any> | undefined 
            = ((await jolokiaService.readAttribute(this.jfrMBean?.objectName as string, "Recordings")) as Array<any>)

        this.recordings = await this.listSavedRecordings(jfrRecordings)
        this.currentRecording = await this.configureCurrentRecording(jfrRecordings)

        return [this.recordings || [], this.currentRecording, jfrRecordings]
    }

    private async listSavedRecordings(jfrRecordings: Array<any>) {
        const jolokiaUrl = await jolokiaService.getFullJolokiaUrl();

        return jfrRecordings
                .filter(recording => recording?.state === "STOPPED")
                .map(
                    recording => ({
                        number: "" + recording.id,
                        size: `${recording.size}b`,
                        file: `${recording.name}.jfr`,
                        time: recording.stopTime,
                        canDownload: true,
                        downloadLink: `${jolokiaUrl}/exec/jdk.management.jfr:type=FlightRecorder/copyTo(long,java.lang.String)/${recording.id}/${recording.id}.jfr`    
                        })
                    )
    }

    private async configureCurrentRecording(jfrRecordings: Array<any>) : Promise<CurrentRecording> {

        const current = jfrRecordings && jfrRecordings.length > 0 && jfrRecordings[jfrRecordings.length - 1]

        if (current?.state === "RUNNING")
            return {
                state: RecordingState.RECORDING,
                number: jfrRecordings?.[jfrRecordings.length -1].id
            }
        
        if (current?.state === "NEW")
            return {
                state: RecordingState.CREATED,
                number: jfrRecordings?.[jfrRecordings.length -1].id
           }

        return {
            state: RecordingState.CREATED,
            number: (await jolokiaService.execute(this.jfrMBean?.objectName as string, "newRecording")) as number
        }
    }

    private async retrieveSettings(): Promise<any> {
        if (!this.jfrMBean) (await this.getFlightRecoderMBean())
        if (!this.currentRecording) (await this.retrieveRecordings())
        
        const initialSettings = 
            await jolokiaService.execute(this.jfrMBean?.objectName as string, "getRecordingOptions", [this.currentRecording?.number]) as any

        const limitType = Number(initialSettings["duration"]) !== 0 ? "duration"
                        : Number(initialSettings["maxSize"]) !== 0 ? "maxSize"
                        : "unlimited" 

        this.userJfrSettings =
            {
                configuration: initialSettings["configuration"] || "default",
                name: initialSettings["name"] as string,
                dumpOnExit: initialSettings["dumpOnExit"] === "true",
                recordingNumber: this.currentRecording?.number as number,
                limitType: limitType,
                limitValue: limitType !== "unlimited" ? Number(initialSettings[limitType]) : 0
            }

        return [this.userJfrSettings, initialSettings]
    }

    async startRecording(userJfrSettings?: UserJfrSettings): Promise<any> {
        this.userJfrSettings = {...this.userJfrSettings, ...(userJfrSettings || {})} as UserJfrSettings
        await jolokiaService.execute(this.jfrMBean?.objectName as string, "setRecordingOptions", [this.currentRecording?.number, this.convertSettingsToJfrOptions(this.userJfrSettings as any)]);
        await jolokiaService.execute(this.jfrMBean?.objectName as string, "setPredefinedConfiguration", [this.currentRecording?.number, this.userJfrSettings?.configuration])
        await jolokiaService.execute(this.jfrMBean?.objectName as string, "startRecording", [this.currentRecording?.number]);
        this.currentRecording.state = RecordingState.RECORDING
    }

    async stopRecording(): Promise<any> {

        await jolokiaService.execute(this.jfrMBean?.objectName as string, "stopRecording", [this.currentRecording.number]);
        await this.retrieveRecordings()
    }

    async downloadRecording(id: number, name: string) {
        const fileData: Uint8Array = await this.retrieveFileData(id)
        const fileUrl = URL.createObjectURL(new Blob([fileData as any], {type: "application/octet-stream"}))
        const fileDownload = document.createElement('a');
        fileDownload.href = fileUrl;
        fileDownload.download = `${name}.jfr`;
        fileDownload.click()
        URL.revokeObjectURL(fileDownload.toString());
    }

    private async retrieveFileData(id: number): Promise<Uint8Array> {
        const responses : Uint8Array[] = []
        let fileRead = false;

        const streamToRead = await jolokiaService.execute(this.jfrMBean?.objectName as string, "openStream(long, javax.management.openmbean.TabularData)", [id, {}])

        while(!fileRead)
            await jolokiaService.execute(this.jfrMBean?.objectName as string, "readStream(long)", [streamToRead])
                .then(response => {

                    //If the value comes as null, the stream has ended transmiting.
                    if(!response) {
                        fileRead = true;
                        return 
                    }

                    responses.push(new Uint8Array(response as number[]))
                })

        await jolokiaService.execute(this.jfrMBean?.objectName as string, "closeStream(long)", [streamToRead])


        return this.concatenateUInt32Array(responses)
    }

    private convertSettingsToJfrOptions(jfrOptions: UserJfrSettings) {
        return {
            "name": "" + jfrOptions.name,
            "dumpOnExit": "" + jfrOptions.dumpOnExit,
            "duration": jfrOptions.limitType === "duration" ? jfrOptions.limitValue : undefined,
            "maxSize": jfrOptions.limitType === "maxSize" ? jfrOptions.limitValue : undefined
        }
    }

    private concatenateUInt32Array(uint8arrays: Uint8Array[]) {
        // Determine the length of the result.
        const totalLength = uint8arrays.reduce(
            (total, uint8Array) => total + uint8Array.byteLength,
            0
        );

        // Allocate the result.
        const result = new Uint8Array(totalLength);

        // Copy each Uint8Array into the result.
        let offset = 0;
        uint8arrays.forEach((uint8arrays) => {
            result.set(uint8arrays, offset);
            offset += uint8arrays.byteLength;
        });

        return result;
    }


}

export const flightRecorderService = new FlightRecorderService()

import { ActionList, Alert, AlertActionLink, AlertGroup, Button, Card, CardHeader, Divider, EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateVariant, Flex, Icon, PageSection, PageSectionVariants, Panel, Spinner, Title } from '@patternfly/react-core'
import React, { Fragment, useEffect, useState } from 'react'
import { CurrentRecording, flightRecorderService, Recording, RecordingState, UserJfrSettings } from './flight-recorder-service'
import { jolokiaService } from '../shared'
import { CogIcon, CubesIcon, DownloadIcon, PlayIcon, StopIcon } from '@patternfly/react-icons'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import './FlightRecorder.css'

export const FlightRecorder: React.FunctionComponent = () => {

    const [initialized, setInitialized] = useState<Boolean>(false)
    const [recordingOnProgress, setRecordingOnProgress] = useState<Boolean>(false)
    const [recordings, setRecordings] = useState<Recording[]>([])
    const [currentRecording, setCurrentRecording] = useState<CurrentRecording>()
    const [configurations, setConfigurations] = useState<String[]>([])
    const [userJfrSettings, setUserJfrSettings] = useState<UserJfrSettings>()
    const [jolokiaUrl, setJolokiaUrl] = useState<String>()
    const [alerts, setAlerts] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        if(!initialized)
            jolokiaService.getFullJolokiaUrl().then(url => {
                setJolokiaUrl(url)
            })

            flightRecorderService.setUp().then(() => {
                setInitialized(true)
                setRecordings(flightRecorderService.recordings)
                setCurrentRecording(flightRecorderService.currentRecording)
                setConfigurations(flightRecorderService.jfrConfigs || [])
                setUserJfrSettings(flightRecorderService.userJfrSettings)
            })
    }, [initialized])

    if(!initialized) return
        (<PageSection>
            <Spinner aria-label='Loading Flight Recorder' />
        </PageSection>)

    if (!(initialized
        && jolokiaUrl
        && ["localhost", "127.0.0.1", "::1", "192.168.", "10.0"].filter(localUrl => jolokiaUrl.includes(localUrl)).length >= 1))
        return (<PageSection>
            <EmptyState variant={EmptyStateVariant.full}>
                <EmptyStateHeader titleText='Tech preview only allows for local connections' icon={<EmptyStateIcon icon={CubesIcon} />} headingLevel='h1' />
            </EmptyState>
        </PageSection>)

    if(initialized && !flightRecorderService.jfrMBean) return
        (<PageSection>
            <EmptyState variant={EmptyStateVariant.full}>
                <EmptyStateHeader titleText='No MBean found for Java Flight Recorder' icon={<EmptyStateIcon icon={CubesIcon} />} headingLevel='h1' />
            </EmptyState>
        </PageSection>)

    const recordingAlert = (text: string, downloadId?: number, timeout?: number) => {
        setAlerts((prevAlerts) => {
            return [
                ...prevAlerts, <Alert
                    title={text}
                    timeout={timeout ? timeout : 2000}
                    actionLinks={
                        downloadId &&
                            <Fragment>
                                <AlertActionLink component="a" onClick={async () => {
                                    await flightRecorderService.downloadRecording(Number(downloadId), "/home/joshiraez")
                                    saveRecordingAlert(downloadId)
                                }}>
                                    Download
                                </AlertActionLink>
                            </Fragment>
                    }
                >
                </Alert>
            ]})
    }

    const startRecordingAlert = () => recordingAlert("Starting recording.")
    const stopRecordingAlert = (recordingId: number) => recordingAlert(`Recording ${recordingId} stored`, recordingId)
    const saveRecordingAlert = (recordingId: number) => recordingAlert(`Saved recording ${recordingId} on /home/joshiraez/${recordingId}.jfr`)

    return (
        <PageSection>
            <React.Fragment>
                <AlertGroup isToast isLiveRegion>{alerts}</AlertGroup>
            </React.Fragment>
            <Card className="flight-recorder-button-divider">
                <Flex direction={{md: 'column'}} alignContent={{md:'alignContentCenter'}}>
                    <CardHeader className="flight-recorder-recording-text">
                        <Title headingLevel='h3'>
                            {
                                currentRecording?.state == RecordingState.RECORDING 
                                    ? "Currently recording..." 
                                    : "Ready to record"
                            }
                        </Title>
                    </CardHeader>
                    <ActionList>
                        <Flex alignContent={{md:'alignContentCenter'}}>
                            <Button 
                                isDisabled={currentRecording?.state == RecordingState.RECORDING} 
                                onClick={() => flightRecorderService.startRecording().then(() => {
                                setRecordingOnProgress(true)
                                startRecordingAlert()
                            })}>
                                <Icon size="md">
                                    <PlayIcon />
                                </Icon>
                            </Button>
                            <Button isDisabled={currentRecording?.state != RecordingState.RECORDING} onClick={() => {
                                flightRecorderService.stopRecording().then(()=> {
                                    stopRecordingAlert(currentRecording?.number as number)
                                    setRecordings(flightRecorderService.recordings)
                                    setCurrentRecording(flightRecorderService.currentRecording)
                                    setUserJfrSettings(flightRecorderService.userJfrSettings)
                                })
                            }}>
                                <Icon size="md">
                                    <StopIcon />
                                </Icon>
                            </Button>
                            <Divider orientation={{md:'vertical'}} />
                            <Button isDisabled={currentRecording?.state == RecordingState.RECORDING}>
                                <Icon size="md">
                                    <CogIcon />
                                </Icon>
                            </Button>
                        </Flex>
                    </ActionList>
                </Flex>
            </Card>

            <Divider />

            <Card>
                <Table>
                    <Thead>
                        <Tr>
                            <Th>Record number</Th>
                            <Th>Name</Th>
                            <Th>Size</Th>
                            <Th>Date</Th>
                            <Th></Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                    {recordings.map(({number, file, size, time}) => (
                        <Tr key={number}>
                            <Td>{number}</Td>
                            <Td>{file}</Td>
                            <Td>{size}</Td>
                            <Td>{new Date(time).toUTCString()}</Td>
                            <Td>
                                <Button 
                                    onClick={async () => {
                                        await flightRecorderService.downloadRecording(Number(number), "/home/joshiraez")
                                        saveRecordingAlert(Number(number))
                                    }}
                                >
                                    <Icon>
                                        <DownloadIcon />
                                    </Icon>
                                </Button>
                            </Td>
                        </Tr>
                    ))}
                    </Tbody>
                </Table>
            </Card>
            

        </PageSection>
    )
}
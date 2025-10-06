import { Button, PageSection } from '@patternfly/react-core'
import React, { useEffect, useState } from 'react'
import { CurrentRecording, flightRecorderService, Recording, UserJfrSettings } from './flight-recorder-service'

export const FlightRecorder: React.FunctionComponent = () => {

    const [initialized, setInitialized] = useState<Boolean>(false)
    const [recordingOnProgress, setRecordingOnProgress] = useState<Boolean>(false)
    const [recordings, setRecordings] = useState<Recording[]>([])
    const [currentRecording, setCurrentRecording] = useState<CurrentRecording>()
    const [configurations, setConfigurations] = useState<String[]>([])
    const [userJfrSettings, setUserJfrSettings] = useState<UserJfrSettings>()

    useEffect(() => {
        if(!initialized)
            flightRecorderService.setUp().then(() => {
                setInitialized(true)
                setRecordings(flightRecorderService.recordings)
                setCurrentRecording(flightRecorderService.currentRecording)
                setConfigurations(flightRecorderService.jfrConfigs || [])
                setUserJfrSettings(flightRecorderService.userJfrSettings)
            })
    }, [initialized])

    if(!initialized) return "Flight Recorder initializing"

    return (
        <PageSection>
            {"Current Recording" + currentRecording?.state + " " + currentRecording?.number}
            {"Settings" + userJfrSettings}
            <Button onClick={() => flightRecorderService.startRecording().then(() => {
                setRecordingOnProgress(true)
            })}>
                Record
            </Button>
            <Button onClick={() => {
                flightRecorderService.stopRecording().then(()=> {
                    setRecordings(flightRecorderService.recordings)
                    setCurrentRecording(flightRecorderService.currentRecording)
                    setUserJfrSettings(flightRecorderService.userJfrSettings)
                })
            }}>
                Stop
            </Button>

            {"Recordings" + recordings.map(record => `${record.number}: ${record.downloadLink}. ${record.file}, ${record.size}, ${Date.UTC(record.time)}\n`)}

        </PageSection>
    )
}
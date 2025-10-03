import { Button, PageSection } from '@patternfly/react-core'
import React from 'react'
import { flightRecorderService } from './flight-recorder-service'

console.log('NJSANDKNSAKJDSADSSADSAASDSA')
console.log(flightRecorderService.getFlightRecoderMBean())
console.log(flightRecorderService.retrieveConfigurations())
console.log(flightRecorderService.retrieveRecordings())
console.log(flightRecorderService.retrieveSettings())
console.log(flightRecorderService)

export const FlightRecorder: React.FunctionComponent = () => {
    return (
        <PageSection>
            <Button onClick={() => flightRecorderService.startRecording()}>
                Record
            </Button>
            <Button onClick={() => {
                flightRecorderService.stopRecording()
                console.log(flightRecorderService.retrieveRecordings())
            }}>
                Stop
            </Button>

        </PageSection>
    )
}
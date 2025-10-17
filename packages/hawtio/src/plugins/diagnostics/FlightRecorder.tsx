import { ActionList, Alert, AlertActionLink, AlertGroup, Button, Card, CardHeader, Checkbox, Divider, Dropdown, DropdownGroup, DropdownItem, DropdownList, EmptyState, EmptyStateHeader, EmptyStateIcon, EmptyStateVariant, Flex, Form, FormGroup, Icon, MenuToggle, MenuToggleElement, Modal, NumberInput, PageSection, PageSectionVariants, Panel, Spinner, Stack, TextInput, Title } from '@patternfly/react-core'
import React, { Fragment, useEffect, useState } from 'react'
import { CurrentRecording, flightRecorderService, JfrConfig, Recording, RecordingState, UserJfrSettings } from './flight-recorder-service'
import { jolokiaService } from '../shared'
import { CogIcon, CubesIcon, DownloadIcon, PlayIcon, RecordVinylIcon, StopIcon } from '@patternfly/react-icons'
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table'
import './FlightRecorder.css'

export const FlightRecorder: React.FunctionComponent = () => {

    const [initialized, setInitialized] = useState<Boolean>(false)
    const [recordingOnProgress, setRecordingOnProgress] = useState<Boolean>(false)
    const [recordings, setRecordings] = useState<Recording[]>([])
    const [currentRecording, setCurrentRecording] = useState<CurrentRecording>()
    const [configurations, setConfigurations] = useState<JfrConfig[]>([])
    const [userJfrSettings, setUserJfrSettings] = useState<UserJfrSettings>()
    const [jolokiaUrl, setJolokiaUrl] = useState<String>()
    const [alerts, setAlerts] = useState<React.ReactNode[]>([]);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isConfigurationsDropdownOpen, setIsConfigurationsDropdownOpen] = useState<boolean>(false)
    const [isLimitTypeOpen, setIsLimitTypeOpen] = useState<boolean>(false)

    const LIMIT_TYPE : {label: string, value: string}[] = 
        [
            {label: 'Unlimited', value: 'unlimited'},
            {label: 'Duration', value: 'duration'},
            {label: 'Size', value: 'maxSize'}
        ]

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
                                    await flightRecorderService.downloadRecording(Number(downloadId))
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
            <Modal
                title={`Settings for recording ${currentRecording?.number}`}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            >
                    <Form>
                        <FormGroup label="Recording configuration">
                            <Dropdown
                                isOpen={isConfigurationsDropdownOpen}
                                onSelect={(_event, value) => {
                                    setUserJfrSettings({...userJfrSettings, configuration: value as string} as UserJfrSettings)
                                    setIsConfigurationsDropdownOpen(false)
                                }}
                                toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                                    <MenuToggle ref={toggleRef} 
                                        onClick={() => setIsConfigurationsDropdownOpen(true)} 
                                        isExpanded={isConfigurationsDropdownOpen}>
                                        {configurations?.find(config => config.name === userJfrSettings?.configuration)?.label || `Select configuration`}
                                    </MenuToggle>
                                )}
                                shouldFocusToggleOnSelect
                            >
                                <DropdownList>
                                    {
                                        configurations?.map((configuration, index) => 
                                            <DropdownItem value={configuration.name} key={index} description={configuration.description}>
                                                {configuration.label}
                                            </DropdownItem>
                                        )
                                    }
                                </DropdownList>
                            </Dropdown>
                        </FormGroup>
                        <FormGroup label="Recording name">
                            <TextInput 
                                aria-label="Recording name"
                                value={userJfrSettings?.name}
                                onChange={(_event, value) => setUserJfrSettings({...userJfrSettings, name: value} as UserJfrSettings)} />
                        </FormGroup>
                        <FormGroup label="Limit">
                            <DropdownGroup label="Type">
                                <Dropdown
                                    isOpen={isLimitTypeOpen}
                                    onSelect={(_event, value) => {
                                        setUserJfrSettings({...userJfrSettings, limitType: value as string, limitValue: value === 'unlimited' ? 0 : userJfrSettings?.limitValue} as UserJfrSettings)
                                        setIsLimitTypeOpen(false)
                                    }}
                                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                                        <MenuToggle ref={toggleRef} 
                                            onClick={() => setIsLimitTypeOpen(true)} 
                                            isExpanded={isLimitTypeOpen}>
                                            {LIMIT_TYPE.find(limitType => limitType.value === userJfrSettings?.limitType)?.label || `Select limit type`}
                                        </MenuToggle>
                                    )}
                                    shouldFocusToggleOnSelect
                                >
                                    <DropdownList>
                                        {LIMIT_TYPE.map(({label, value}) =>
                                            <DropdownItem key={value} value={value}>
                                                {label}
                                            </DropdownItem>
                                        )}  
                                    </DropdownList>
                                </Dropdown>
                            </DropdownGroup>
                            <TextInput 
                                type="number" 
                                label="Value"
                                aria-label="Value"
                                value={userJfrSettings?.limitValue || 0}
                                isDisabled={userJfrSettings?.limitType === "unlimited"}
                                onChange={(_event, value) => setUserJfrSettings({...userJfrSettings, limitValue: Number(value)} as UserJfrSettings)} />
                        </FormGroup>
                        <Checkbox
                            id="dump-on-exit-checkbox"
                            label="Dump on exit"
                            isChecked={userJfrSettings?.dumpOnExit}
                            onChange={(_event, value) => setUserJfrSettings({...userJfrSettings, dumpOnExit: value} as UserJfrSettings)}
                        />
                    </Form>
            </Modal>
            <Stack hasGutter>
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
                                        <RecordVinylIcon />
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
                                <Button 
                                    isDisabled={currentRecording?.state == RecordingState.RECORDING}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    <Icon size="md">
                                        <CogIcon />
                                    </Icon>
                                </Button>
                            </Flex>
                        </ActionList>
                    </Flex>
                </Card>

                <Card>
                    <Table>
                        <Thead>
                            <Tr>
                                <Th>Record number</Th>
                                <Th>Name</Th>
                                <Th>Size</Th>
                                <Th>Date</Th>
                                <Th>Download</Th>
                            </Tr>
                        </Thead>
                        <Tbody>
                        {recordings
                            .sort((recordA, recordB) => Number(recordB.number) - Number(recordA.number))
                            .map(({number, file, size, time}) => (
                            <Tr key={number}>
                                <Td>{number}</Td>
                                <Td>{file}</Td>
                                <Td>{size}</Td>
                                <Td>{new Date(time).toUTCString()}</Td>
                                <Td>
                                    <Button 
                                        onClick={async () => {
                                            await flightRecorderService.downloadRecording(Number(number))
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
                
            </Stack>
        </PageSection>
    )
}
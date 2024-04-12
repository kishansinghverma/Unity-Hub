import { Button, ButtonGroup, Icon, Modal, ModalActions, ModalContent, ModalHeader, Table } from "semantic-ui-react"
import { CustomTable, EmptyTable, TablePagination } from "../common/components"
import { ReactState, TableRenderer, handleError, handleJsonResponse } from "../operations/utils"
import { Party, Record } from "../common/types"
import { useEffect } from "react"
import { DeleteParams, Url } from "../common/constants"
import { EditPartyForm } from "./editparty"
import { toast } from "react-toastify"

export const Parties: React.FC = () => {
    const { records, render, getPaginated, pageCount, currentPage, isFetching } = new TableRenderer<Party>(Url.Parties, 8);
    const isModalOpen = ReactState(false);
    const recordToEdit = ReactState<Record<Party>>(records.get()[0]);

    const filterRecords = ((response: Record<Party>) => {
        const filteredRecords = records.get().filter(record => record._id !== response._id);
        records.set(filteredRecords);
    });

    const deleteParty = (partyId: string) => {
        isFetching.set(true);
        fetch(`${Url.Parties}/${partyId}`, DeleteParams)
            .then(handleJsonResponse)
            .then(filterRecords)
            .then(() => toast.success("पार्टी सफलतापूर्वक हटा दी गई है।"))
            .catch(handleError)
            .finally(() => isFetching.set(false));
    };

    const editParty = (record: Record<Party>) => {
        recordToEdit.set(record);
        isModalOpen.set(true);
    };

    const postSuccess = (updatedRecord: Record<Party>) => {
        isModalOpen.set(false);
        const updatedRecords = records.get().map(record => ((record._id === recordToEdit.get()._id) ? { ...updatedRecord } : record));
        records.set(updatedRecords)
    }

    useEffect(render, []);

    return (
        <>
            <CustomTable title="पार्टियों की सूची" refresh={render} isFetching={isFetching.get()}>
                <Table.Header>
                    <Table.Row>
                        <Table.HeaderCell width={5}>Name</Table.HeaderCell>
                        <Table.HeaderCell width={3}>Mandi</Table.HeaderCell>
                        <Table.HeaderCell width={2}>State</Table.HeaderCell>
                        <Table.HeaderCell width={2}>Distance (K.M.)</Table.HeaderCell>
                        <Table.HeaderCell width={3}>Licence</Table.HeaderCell>
                        <Table.HeaderCell width={2} textAlign="center">Actions</Table.HeaderCell>
                    </Table.Row>
                </Table.Header>
                {records.get().length < 1 ?
                    <EmptyTable headerColumns={9} message="अभी तक कोई पार्टी नहीं जोड़ी गई है." /> :
                    <>
                        <Table.Body>
                            {getPaginated().map((record, index) => (
                                <Table.Row key={`row-${index}`}>
                                    <Table.Cell>{record.name}</Table.Cell>
                                    <Table.Cell>{record.mandi}</Table.Cell>
                                    <Table.Cell>{record.state}</Table.Cell>
                                    <Table.Cell>{record.distance}</Table.Cell>
                                    <Table.Cell>{record.licenceNumber}</Table.Cell>
                                    <Table.Cell textAlign="center">
                                        <ButtonGroup basic compact size="tiny">
                                            <Button title="Edit" onClick={() => editParty(record)}><Icon name="edit" link color="green" /></Button>
                                            <Button title="Delete" onClick={() => { deleteParty(record._id) }}><Icon name="trash" link color="red" /></Button>
                                        </ButtonGroup>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                        <Table.Footer>
                            <TablePagination colSpan={6} currentPage={currentPage} pageCount={pageCount} />
                        </Table.Footer>
                    </>
                }
            </CustomTable>
            <Modal size="tiny" dimmer="blurring" centered={false} mountNode={document.querySelector('#root > div > div.content-container')} closeOnDimmerClick={false} open={isModalOpen.get()} onClose={() => isModalOpen.set(false)}>
                <ModalHeader>पार्टी संशोधित करें</ModalHeader>
                <ModalContent>
                    <EditPartyForm {...{ party: recordToEdit.get(), callbackFunction: postSuccess }} />
                </ModalContent>
                <ModalActions>
                    <Button positive onClick={() => document.getElementById('submit-btn')?.click()}> Submit </Button>
                    <Button negative onClick={() => isModalOpen.set(false)}> Cancel </Button>
                </ModalActions>
            </Modal>
        </>
    )
}
import { useEffect } from "react";
import { Icon, Table } from "semantic-ui-react";
import { CustomTable, EmptyTable, TablePagination } from "../common/components";
import { QueuedEntry, Record } from "../common/types";
import { DeleteParams, Url, vehicleType } from "../common/constants";
import { handleJsonResponse, handleError, TableRenderer } from "../operations/utils";

export const QueuedPage: React.FC = () => {
    const { records, pageCount, getPaginated, currentPage, isFetching, render } = new TableRenderer<QueuedEntry>(Url.Queued, 10);

    const filterRecords = (response: Record<QueuedEntry>) => {
        const filteredRecords = records.get().filter(record => record._id !== response._id);
        records.set(filteredRecords);
    }

    const deleteRecord = (id: string) => {
        isFetching.set(true);
        fetch(`${Url.Delete}/${id}`, DeleteParams)
            .then(handleJsonResponse)
            .then(filterRecords)
            .catch(handleError)
            .finally(() => { isFetching.set(false) });
    }

    useEffect(render, []);

    return (
        <CustomTable title="जारी होने वाले रिकॉर्ड" refresh={render} isFetching={isFetching.get()}>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell width={4}>Date</Table.HeaderCell>
                    <Table.HeaderCell width={9}>Seller</Table.HeaderCell>
                    <Table.HeaderCell width={5}>Vehicle</Table.HeaderCell>
                    <Table.HeaderCell width={3}>Type</Table.HeaderCell>
                    <Table.HeaderCell width={9}>Party</Table.HeaderCell>
                    <Table.HeaderCell width={3}>Bags</Table.HeaderCell>
                    <Table.HeaderCell width={3}>Weight</Table.HeaderCell>
                    <Table.HeaderCell width={3} textAlign="center">Delete</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            {records.get().length < 1 ?
                <EmptyTable headerColumns={9} message="कोई नया गेटपास अनुरोध प्राप्त नहीं हुआ।" /> :
                <>
                    <Table.Body>
                        {getPaginated().map((record, index) => (
                            <Table.Row key={`row-${index}`}>
                                <Table.Cell>{record.date}</Table.Cell>
                                <Table.Cell>{record.seller}</Table.Cell>
                                <Table.Cell>{record.vehicleNumber}</Table.Cell>
                                <Table.Cell>{vehicleType[record.vehicleType]}</Table.Cell>
                                <Table.Cell>{record.party.name}, {record.party.mandi}</Table.Cell>
                                <Table.Cell>{record.bags}</Table.Cell>
                                <Table.Cell>{record.weight}</Table.Cell>
                                <Table.Cell textAlign="center">
                                    <Icon name="trash" color="red" link onClick={() => { deleteRecord(record._id) }} />
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                    <Table.Footer>
                        <TablePagination colSpan={8} currentPage={currentPage} pageCount={pageCount} />
                    </Table.Footer>
                </>
            }
        </CustomTable >
    )
}
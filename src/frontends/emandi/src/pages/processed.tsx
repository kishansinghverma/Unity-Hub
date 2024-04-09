import { useEffect } from "react";
import { Icon, Table } from "semantic-ui-react";
import { CustomTable, EmptyTable, TablePagination } from "../common/components";
import { ProcessedEntry, Record } from "../common/types";
import { TableRenderer, getDate, handleError, handleJsonResponse } from "../operations/utils";
import { Url } from "../common/constants";

export const ProcessedPage: React.FC = () => {
    const { records, getPaginated, pageCount, isFetching, currentPage, render } = new TableRenderer<ProcessedEntry>(Url.Processed, 8, true);

    const filterRecords = (response: Record<ProcessedEntry>) => {
        const filteredRecords = records.get().filter(record => record._id !== response._id);
        records.set(filteredRecords);
    }

    const requeue = (id: string | undefined) => {
        isFetching.set(true);
        fetch(`${Url.Requeue}/${id}`)
            .then(handleJsonResponse)
            .then(filterRecords)
            .catch(handleError)
            .finally(() => isFetching.set(false));
    }

    useEffect(render, []);

    return (
        <CustomTable title="जारी हो चुके रिकॉर्ड" refresh={render} isFetching={isFetching.get()}>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell width={3}>Date</Table.HeaderCell>
                    <Table.HeaderCell width={5}>Seller</Table.HeaderCell>
                    <Table.HeaderCell width={4}>Vehicle</Table.HeaderCell>
                    <Table.HeaderCell width={8}>Party</Table.HeaderCell>
                    <Table.HeaderCell width={2}>Bags</Table.HeaderCell>
                    <Table.HeaderCell width={2}>Weight</Table.HeaderCell>
                    <Table.HeaderCell width={2}>Rate</Table.HeaderCell>
                    <Table.HeaderCell width={2}>Amount</Table.HeaderCell>
                    <Table.HeaderCell width={3}>Mode</Table.HeaderCell>
                    <Table.HeaderCell width={2} textAlign="center">Actions</Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            {records.get().length < 1 ?
                <EmptyTable headerColumns={9} message="अभी तक कोई गेटपास जारी नहीं किया गया है।" /> :
                <>
                    <Table.Body>
                        {getPaginated().map((record, index) => (
                            <Table.Row key={`row-${index}`}>
                                <Table.Cell>{record.date}</Table.Cell>
                                <Table.Cell>{record.seller}</Table.Cell>
                                <Table.Cell>{record.vehicleNumber}</Table.Cell>
                                <Table.Cell>{record.party.name}, {record.party.mandi}</Table.Cell>
                                <Table.Cell>{record.bags}</Table.Cell>
                                <Table.Cell>{record.weight}</Table.Cell>
                                <Table.Cell>{record.rate ? Math.ceil(record.rate) : 'N/A'}</Table.Cell>
                                <Table.Cell>{record.rate ? Math.ceil(record.rate * parseInt(record.weight) * 1.5 / 100) : 'N/A'}</Table.Cell>
                                <Table.Cell>{record.paymentMode ?? 'Postpaid'}</Table.Cell>
                                <Table.Cell textAlign="center">
                                    {(record._id && record.date === getDate()) && <Icon name="upload" title="Requeue" color="green" link onClick={() => { requeue(record._id) }} />}
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                    <Table.Footer>
                        <TablePagination colSpan={10} currentPage={currentPage} pageCount={pageCount} />
                    </Table.Footer>
                </>
            }
        </CustomTable >
    )
}
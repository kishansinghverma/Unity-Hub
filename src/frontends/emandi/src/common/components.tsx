import { Table, Input, DropdownProps, Icon, Dropdown, Loader, Dimmer, Pagination as SemanticPagination } from "semantic-ui-react";
import { IHeader, ITable, Pagination } from "./types";
import React, { SyntheticEvent } from "react";
import { getRandom } from "../operations/utils";

export const CustomForm: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div className="custom-form"> {children} </div>
);

export const Div: React.FC<React.PropsWithChildren & React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
    <div {...props}>{children}</div>
);

export const CustomSelect: React.FC<DropdownProps> = (props) => {
    const elementId = getRandom(8);

    const onChange = (e: SyntheticEvent<HTMLElement, Event>, element: DropdownProps) => {
        (document.getElementById(elementId) as HTMLInputElement).value = element.value?.toString() ?? '';
        (e.target as HTMLInputElement).value = element.value?.toString() ?? '';
        props.onChange?.(e, element);
    }

    return (
        <>
            <Input
                id={elementId}
                name={props.name}
                required={props.required}
                value={props.value}
                style={{ display: 'none' }}
            />
            <Dropdown
                selection
                name={props.name}
                required={props.required}
                onChange={onChange}
                placeholder={props.placeholder}
                clearable={props.clearable}
                options={props.options ?? []}
                loading={props.loading}
                value={props.value?.toString()}
            />
        </>
    )
}

export const CustomTable: React.FC<React.PropsWithChildren & IHeader> = ({ children, title, refresh, isFetching }) => (
    <>
        <Dimmer active={isFetching} inverted><Loader size="big" /></Dimmer>
        <div className="header-container">
            <div className="table-header"> {title} </div>
            <div className="header-btn-container">
                <Icon name="refresh" title="Reload" size="large" color="red" link loading={isFetching} onClick={refresh}></Icon>
            </div>
        </div>
        <div className="list-container">
            <Table celled fixed singleLine striped unstackable selectable compact="very" color="red" className="fixed">{children}</Table>
        </div>
    </>
);

export const EmptyTable: React.FC<ITable> = ({ message, headerColumns }) => (
    <Table.Body>
        <Table.Row>
            <Table.Cell colSpan={headerColumns}>{message}</Table.Cell>
        </Table.Row>
    </Table.Body>
);

export const TablePagination: React.FC<Pagination> = ({ currentPage, pageCount, colSpan }) => (
    <Table.Row>
        <Table.HeaderCell colSpan={colSpan}>
            <SemanticPagination
                activePage={currentPage.get()}
                totalPages={pageCount.get()}
                onPageChange={(_, data) => currentPage.set(data.activePage as number)}
                boundaryRange={1}
                siblingRange={1}
                ellipsisItem={{ content: <Icon name='ellipsis horizontal' />, icon: true }}
                firstItem={{ content: <Icon name='angle double left' />, icon: true }}
                lastItem={{ content: <Icon name='angle double right' />, icon: true }}
                prevItem={{ content: <Icon name='angle left' />, icon: true }}
                nextItem={{ content: <Icon name='angle right' />, icon: true }}
                color="red"
                size="tiny"
            />
        </Table.HeaderCell>
    </Table.Row>
);
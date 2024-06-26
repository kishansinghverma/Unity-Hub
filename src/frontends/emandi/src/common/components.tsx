import { Table, Image, Placeholder, Input, DropdownProps, Icon, Menu, Dropdown, Loader, Dimmer, Divider } from "semantic-ui-react";
import { CustomCardProps, IHeader, ITable, Pagination, RawExpense } from "./types";
import React, { SyntheticEvent, useState } from "react";
import dayjs from "dayjs";
import { getRandom } from "../operations/utils";

export const CustomForm: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div className="custom-form"> {children} </div>
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
        <div className="scrollable">
            <Table celled fixed singleLine striped unstackable selectable compact color="red">{children}</Table>
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
            <Menu pagination color="red">
                <Menu.Item icon onClick={() => { currentPage.set(currentPage.get() - 1) }} disabled={currentPage.get() <= 1}>
                    <Icon color="red" name='chevron left' />
                </Menu.Item>
                {[...Array(pageCount.get())].map((item, index) => (
                    <Menu.Item key={`menu-${index}`} onClick={() => { currentPage.set(index + 1) }} active={currentPage.get() === index + 1}>{index + 1}</Menu.Item>
                ))}
                <Menu.Item icon onClick={() => { currentPage.set(currentPage.get() + 1) }} disabled={currentPage.get() >= pageCount.get()}>
                    <Icon color="red" name='chevron right' />
                </Menu.Item>
            </Menu>
        </Table.HeaderCell>
    </Table.Row>

);

export const ExpenseItem: React.FC<React.PropsWithChildren & RawExpense> = ({ _id, dateTime, location, coordinate, onDelete }) => {
    return (
        <div className="expense-card">
            <div className="expense-card-body">
                <div className="expense-card-header">
                    <div style={{ marginBottom: '5px' }}>🗓️&nbsp;{dayjs(dateTime).format('DD/MM/YYYY')}</div>
                    <div style={{ marginBottom: '5px' }}>🕒&nbsp;{dayjs(dateTime).format('hh:mm A')}</div>
                </div>
                <div className="expense-card-link">
                    <div>🌎&nbsp;</div>
                    <div><a target='_blank' rel="noreferrer" href={`https://www.google.com/maps?q=${coordinate}`}>{location.replaceAll('\n', ', ')}</a></div>
                </div>
            </div>
            <Divider />
            <div className="expense-card-action">
                <Icon name="trash" title="Requeue" color="red" link onClick={() => { onDelete(_id) }} />
            </div>
        </div>
    )
};

export const GroupCard: React.FC<React.PropsWithChildren & CustomCardProps> = ({ ImageSrc, Name, Info }) => {
    const [isLoading, setLoading] = useState(true);

    return (
        <>
            {isLoading &&
                <>
                    <Placeholder style={{ height: '120px' }}>
                        <Placeholder.Image square />
                    </Placeholder>
                    <Placeholder style={{ margin: '0px' }}>
                        <Placeholder.Line length='very long' />
                        <Placeholder.Line length='long' />
                    </Placeholder>
                </>
            }
            <div style={{ padding: '5px 0px' }}>
                <Image
                    centered
                    circular
                    size='tiny'
                    src={ImageSrc}
                    onLoad={() => setLoading(false)}
                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); }}
                />
                {!isLoading &&
                    <>
                        <div style={{ textAlign: 'center', fontWeight: 'bold', padding: '8px 4px 2px' }}>{Name}</div>
                        <div style={{ textAlign: 'center', color: 'grey' }}>{Info}</div>
                    </>
                }
            </div>
        </>
    )
}


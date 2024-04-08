import { Table, Image, Placeholder, Input, DropdownProps, Icon, Menu, Dropdown, Segment } from "semantic-ui-react";
import { CustomCardProps, IHeader, ITable, Pagination, RawExpense } from "./types";
import React, { SyntheticEvent, useState } from "react";
import dayjs from "dayjs";

export const CustomForm: React.FC<React.PropsWithChildren> = ({ children }) => (
    <div className="custom-form"> {children} </div>
);

export const CustomSelect: React.FC<DropdownProps> = (props) => {
    const [value, setValue] = useState<string>((props.value ?? '').toString());
    const onChange = (e: SyntheticEvent<HTMLElement, Event>, element: DropdownProps) => {
        setValue(element.value as string);
        props.onChange && props.onChange(e, element);
    }

    return (
        <>
            <Input name={props.name} type="text" value={value} required={props.required} style={{ display: 'none' }} />
            <Dropdown
                selection
                name={props.name}
                required={props.required}
                onChange={onChange}
                placeholder={props.placeholder}
                clearable={props.clearable}
                options={props.options ?? []}
                loading={props.loading}
                value={value}
            />
        </>
    )
}

export const CustomTable: React.FC<React.PropsWithChildren & IHeader> = ({ children, title, refresh, isFetching }) => (
    <>
        <div className="header-container">
            <div className="table-header"> {title} </div>
            <div className="header-btn-container">
                <Icon name="retweet" className="refresh-btn" size="large" onClick={refresh}></Icon>
            </div>
        </div>
        <div className="scrollable">
            <Segment basic loading={isFetching} className="table-segment">{children}</Segment>
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
            <Menu pagination>
                <Menu.Item icon onClick={() => { currentPage.set(currentPage.get() - 1) }} disabled={currentPage.get() <= 1}>
                    <Icon name='chevron left' />
                </Menu.Item>
                {[...Array(pageCount.get())].map((item, index) => (
                    <Menu.Item key={`menu-${index}`} onClick={() => { currentPage.set(index + 1) }} active={currentPage.get() === index + 1}>{index + 1}</Menu.Item>
                ))}
                <Menu.Item icon onClick={() => { currentPage.set(currentPage.get() + 1) }} disabled={currentPage.get() >= pageCount.get()}>
                    <Icon name='chevron right' />
                </Menu.Item>
            </Menu>
        </Table.HeaderCell>
    </Table.Row>

);

export const ExpenseItem: React.FC<React.PropsWithChildren & RawExpense> = ({ Id, DateTime, Location, Coordinate, OnDelete }) => {
    return (
        <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', fontWeight: 'bold' }}>
                <div style={{ marginBottom: '5px' }}>🗓️&nbsp;{dayjs(DateTime).format('DD/MM/YYYY')}</div>
                <div style={{ marginBottom: '5px' }}>🕒&nbsp;{dayjs(DateTime).format('hh:mm A')}</div>
            </div>
            <div style={{ color: 'grey', display: 'flex' }}>
                <div>🌎&nbsp;</div>
                <div><a target='_blank' rel="noreferrer" href={`https://www.google.com/maps?q=${Coordinate}`}>{Location}</a></div>
                <div>&emsp;<i className="fas fa-trash btn-delete" onClick={() => OnDelete(Id)} /></div>
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


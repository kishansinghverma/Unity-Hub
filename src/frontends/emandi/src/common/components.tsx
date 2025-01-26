import { Table, Image, Placeholder, Input, DropdownProps, Icon, Menu, Dropdown, Loader, Dimmer, Divider, Card, Label } from "semantic-ui-react";
import { CardInfoProps, GroupCardProps, IHeader, ITable, Pagination, RawExpense } from "./types";
import React, { SyntheticEvent, useEffect, useState } from "react";
import dayjs from "dayjs";
import { getRandom, handleResponse } from "../operations/utils";
import { SharingStatus, Url } from "./constants";
import { updateGroupInfo } from "../operations/fetch";

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
                <Icon name="trash" title="Delete" color="red" link onClick={() => { onDelete(_id) }} />
            </div>
        </div>
    )
};

export const GroupCard: React.FC<React.PropsWithChildren & GroupCardProps> = (cardProps) => {
    return (
        <Card
            raised
            id={cardProps.id}
            style={{ userSelect: 'none' }}
            onDragLeave={cardProps.onDragLeave}
            onDragOver={cardProps.onDragOver}
            onDrop={cardProps.onDrop}
            onClick={cardProps.onClick}
        >
            <CardInfo {...cardProps} />
        </Card>
    )
}

export const CardInfo: React.FC<React.PropsWithChildren & CardInfoProps> = ({ id, imageSrc, name, due }) => {
    const [isLoading, setLoading] = useState(true);
    const [isUpdating, setUpdating] = useState(true);
    const [isShared, setShared] = useState<SharingStatus>(SharingStatus.Unknown);

    const onShareToggle = (id: number, name: string, isShared: SharingStatus) => {
        const sharing = isShared === SharingStatus.NotShared || isShared === SharingStatus.Unknown;
        setUpdating(true);
        updateGroupInfo({ id, name, isShared: sharing })
            .then(() => setShared(sharing ? SharingStatus.Shared : SharingStatus.NotShared))
            .finally(() => setUpdating(false));
    };

    useEffect(() => {
        fetch(`${Url.ExpenseGroups}/${id}/sharedStatus`)
            .then(response => {
                handleResponse(response, 'Group Details Not Available!');
                return response.json();
            })
            .then(({ isShared }) => setShared(isShared ? SharingStatus.Shared : SharingStatus.NotShared))
            .catch((e) => console.log(e.message))
            .finally(() => setUpdating(false));
    }, []);

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
            <div style={{ padding: '5px 0px 0px' }}>
                <Image
                    centered
                    circular
                    size='tiny'
                    src={imageSrc}
                    onLoad={() => setLoading(false)}
                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); }}
                />
                {!isLoading &&
                    <>
                        <div className="group-name" id={`group-${id}`} data-is-shared={isShared}>{name}</div>
                        <Label className="due-indicator" attached="bottom">
                            <div className="due-amount">
                                <Icon name='rupee sign' />
                                <span>{due}</span>
                            </div>
                            {isUpdating && <Loader active inline size="mini" />}
                            {!isUpdating && <Icon
                                name="balance scale"
                                color={isShared === SharingStatus.Shared ? 'green' : isShared === SharingStatus.NotShared ? 'red' : 'grey'}
                                onClick={(e: React.MouseEvent) => {
                                    onShareToggle(id, name, isShared);
                                    e.stopPropagation();
                                }}
                            />}
                        </Label>
                    </>
                }
            </div>
        </>
    )
}


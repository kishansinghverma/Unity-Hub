import { Table, Image, Placeholder, Input, DropdownProps, Icon, Menu, Dropdown, Loader, Dimmer, Card, Label, Button } from "semantic-ui-react";
import { BankEntry, CardInfoProps, DraftEntry, GroupCardProps, IHeader, ITable, Pagination, PhonePeEntry, WithId } from "./types";
import React, { SyntheticEvent, useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { getRandom, handleResponse } from "../operations/utils";
import { SharingStatus, Url } from "./constants";
import { updateGroupInfo, uploadBankStatement, uploadPhonePeStatement } from "../operations/fetch";
import { extractDataFromExcel, parsePhonePeStatement } from "../operations/parser";
import { toast } from "react-toastify";

import { ReactComponent as HdfcLogo } from '../static/hdfc.svg';
import { ReactComponent as SbiLogo } from '../static/sbi.svg';
const bankLogo: { [key: string]: JSX.Element } = {
    HDFC: <HdfcLogo width={28} height={28} />,
    SBI: <SbiLogo width={28} height={28} />
}

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

export const BankItem: React.FC<React.PropsWithChildren & BankEntry> = ({ date, description, amount, type, bank }) => (
    <Div className="expense-item">
        <Div className="section-left">
            <Div className="month">{dayjs(date).format('MMM')}</Div>
            <Div className="date">{dayjs(date).format('DD')}</Div>
        </Div>
        <Div className="bank-logo"> {bankLogo[bank]} </Div>
        <Div className="description"> {(description as string).toUpperCase()}</Div>
        <Div className="section-right">
            <Div>&nbsp;</Div>
            <Div className={`text-${type.toLowerCase()}`}>₹{amount.toFixed(2)}</Div>
        </Div>
    </Div>
);

export const PhonePeItem: React.FC<React.PropsWithChildren & PhonePeEntry> = ({ date, recipient, amount, type, bank }) => (
    <Div className="expense-item">
        <Div className="section-left">
            <Div className="month">{dayjs(date).format('MMM')}</Div>
            <Div className="date">{dayjs(date).format('DD')}</Div>
        </Div>
        <Div className="bank-logo"> {bankLogo[bank]} </Div>
        <Div className="description"> {(recipient as string).toUpperCase()}
        </Div>
        <Div className="section-right">
            <Div className="time">{dayjs(date).format('hh:mm A')}</Div>
            <Div className={`text-${type.toLowerCase()}`}>₹{amount.toFixed(2)}</Div>
        </Div>
    </Div>
);

export const ExpenseItem: React.FC<React.PropsWithChildren & WithId<DraftEntry>> = ({ _id, dateTime, location, coordinate, onDelete }) => (
    <Div className="expense-item">
        <Div className="section-left">
            <Div className="month">{dayjs(dateTime).format('MMM')}</Div>
            <Div className="date">{dayjs(dateTime).format('DD')}</Div>
        </Div>
        <Div className="description">
            <a target='_blank' rel="noreferrer" href={`https://www.google.com/maps?q=${coordinate}`}>{location.replaceAll('\n', ', ')}</a>
        </Div>
        <Div className="section-right">
            <Div className="time">{dayjs(dateTime).format('hh:mm A')}</Div>
            <Div>
                <Icon name="trash" title="Delete" color="red" link onClick={() => { onDelete(_id) }} />
            </Div>
        </Div>
    </Div>
);

export const GroupCard: React.FC<React.PropsWithChildren & GroupCardProps> = (cardProps) => {
    return (
        <Card
            raised
            id={cardProps.id}
            style={{ userSelect: 'none', minWidth: '164px' }}
            onClick={cardProps.onClick}
        >
            <CardInfo {...cardProps} />
        </Card>
    )
}

export const CardInfo: React.FC<React.PropsWithChildren & CardInfoProps> = ({ id, imageSrc, name, due, getSharing }) => {
    const [isLogoLoading, setLogoLoading] = useState(true);
    const [isUpdating, setUpdating] = useState(getSharing && true);
    const [isShared, setShared] = useState<SharingStatus>(SharingStatus.Unknown);

    const onShareToggle = (id: number, name: string, isShared: SharingStatus) => {
        const sharing = isShared === SharingStatus.NotShared || isShared === SharingStatus.Unknown;
        setUpdating(true);
        updateGroupInfo({ id, name, isShared: sharing })
            .then(() => setShared(sharing ? SharingStatus.Shared : SharingStatus.NotShared))
            .finally(() => setUpdating(false));
    };

    useEffect(() => {
        if (getSharing) {
            fetch(`${Url.ExpenseGroups}/${id}/sharedStatus`)
                .then(response => {
                    handleResponse(response, 'Group Details Not Available!');
                    return response.json();
                })
                .then(({ isShared }) => setShared(isShared ? SharingStatus.Shared : SharingStatus.NotShared))
                .catch((e) => console.log(e.message))
                .finally(() => setUpdating(false));
        }
    }, []);

    return (
        <>
            {isLogoLoading &&
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
                    onLoad={() => setLogoLoading(false)}
                    onDragStart={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); }}
                />
                {!isLogoLoading &&
                    <>
                        <div className="group-name" id={`group-${id}`} data-is-shared={isShared}>{name}</div>
                        <Label className="due-indicator" attached="bottom">
                            <Div className="due-amount">
                                <Icon name='rupee sign' />
                                <span>{due}</span>
                            </Div>
                            {isUpdating && <Loader active inline size="mini" />}
                            {!isUpdating && getSharing && <Icon
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

export const FileUpload: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file?.type === 'application/pdf') {
            const response = parsePhonePeStatement(file).then(uploadPhonePeStatement)
            toast.promise(response, {
                pending: { render: () => ("Uploading PhonePe Statement...") },
                success: { render: ({ data }) => (`Uploaded ${data.insertedCount}/${data.totalCount} records.`) },
                error: { render: ({ data }: any) => (data.message) }
            });
        }
        else if (file?.type === 'application/vnd.ms-excel') {
            const response = extractDataFromExcel(file).then(uploadBankStatement);
            toast.promise(response, {
                pending: { render: () => ("Uploading Bank Statement...") },
                success: { render: ({ data }) => (`Uploaded ${data.insertedCount}/${data.totalCount} records.`) },
                error: { render: ({ data }: any) => (data.message) }
            });
        }
        else {
            toast.error("File type not supported.");
        }
    };

    return (
        <Div style={{ paddingRight: '12px' }}>
            <input type="file" ref={fileInputRef} hidden onChange={handleFileChange} />
            <Button color='red' icon='upload' circular onClick={() => fileInputRef.current?.click()} />
        </Div>
    );
};
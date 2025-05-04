import dayjs from 'dayjs';
import { toast } from "react-toastify";
import { useEffect } from "react";
import { Grid, Header, Segment, Image, Button, Modal, Loader, Form, Label, RadioProps, DropdownProps, Icon, GridColumn, GridRow, Placeholder, PlaceholderLine, PlaceholderParagraph, PlaceholderImage, TransitionGroup, Radio, CheckboxProps, TableRow, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableFooter, ListItem, List, Popup, Input, Item, Checkbox, Container } from "semantic-ui-react"
import { SelectOption, SplitwiseGroup, WithId, DraftEntry, BankEntry, PhonePeEntry, ExpenseModalParams, ReviewModalParams, Nullable, ReviewCompletionParams } from "../common/types";
import { PostParams, SharingStatus, Url } from "../common/constants";
import { ContentState, ModalState, ReactState, SplitwiseGroupMapper, SplitwiseGroupsMapper, StringUtils, capitalize, getDateTime, handleError, handleJsonResponse, handleResponse } from "../operations/utils";
import { BankItem, Div, ExpenseItem, FileUpload, GroupCard, PhonePeItem } from "../common/components";
import { ReactComponent as HdfcLogo } from '../static/hdfc.svg';
import { ReactComponent as SbiLogo } from '../static/sbi.svg';
import React from 'react';

const bankLogo: { [key: string]: JSX.Element } = {
    HDFC: <HdfcLogo width={28} height={28} />,
    SBI: <SbiLogo width={28} height={28} />
}

const normalizeToMinute = (date: Date | string | undefined) => dayjs(date).startOf('minute').valueOf();

const getPhonePeMatches = (bankEntry: Nullable<WithId<BankEntry>>, phonePeEntries: WithId<PhonePeEntry>[]) => {
    return phonePeEntries.filter(entry =>
        entry.amount === bankEntry?.amount && dayjs(bankEntry.date).format('DD/MMM') === dayjs(entry.date).format('DD/MMM'));
}

const getDraftMatches = (phonePeEntry: Nullable<WithId<PhonePeEntry>>, draftEntries: WithId<DraftEntry>[]) => {
    const phonePeTimeNormalized = normalizeToMinute(phonePeEntry?.date)
    const draftEntry = draftEntries.find(t => phonePeTimeNormalized === normalizeToMinute(t.dateTime));
    if (draftEntry) return [draftEntry];

    const delta = (5 * 60 * 1000);
    const upperDelta = phonePeTimeNormalized + delta;
    const lowerDelta = phonePeTimeNormalized - delta;
    return draftEntries.filter(t => normalizeToMinute(t.dateTime) >= lowerDelta && normalizeToMinute(t.dateTime) <= upperDelta);
}

export const Expense: React.FC = () => {
    const isExpenseSaving = ReactState(false);
    const refinementDate = ReactState(1);
    const draftEntries = ContentState<Array<WithId<DraftEntry>>>([]);
    const bankEntries = ContentState<Array<WithId<BankEntry>>>([]);
    const phonepeEntries = ContentState<Array<WithId<PhonePeEntry>>>([]);
    const groups = ContentState<Array<SplitwiseGroup>>([]);
    const descriptions = ContentState<Array<SelectOption>>([]);
    const expenseModal = ModalState<ExpenseModalParams>({});
    const reviewExpenseModal = ModalState<{
        currentItem?: string
    }>({});

    const onCheckedChanged = (_: any, { name, value }: RadioProps) =>
        expenseModal.setParams({ ...expenseModal.params, [name as string]: JSON.parse(value as string) });


    const onExpenseModalClose = () => {
        expenseModal.setParams({});
        expenseModal.close();
    }

    const onGroupClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const group = groups.content.find(group => group.id.toString() === e.currentTarget.id);
        setModalParameters(group);
        expenseModal.open();
    }

    const onReviewComplete = (completionParams: ReviewCompletionParams) => {
        if (completionParams.draftTransactionId)
            draftEntries.setContent(draftEntries.content.map(entry =>
                entry._id === completionParams.draftTransactionId ? { ...entry, processed: true } : entry));

        if (completionParams.phonePeTransactionId)
            phonepeEntries.setContent(phonepeEntries.content.map(entry =>
                entry._id === completionParams.phonePeTransactionId ? { ...entry, processed: true } : entry));

        if (completionParams.bankTransactionId)
            bankEntries.setContent(bankEntries.content.map(entry =>
                entry._id === completionParams.bankTransactionId ? { ...entry, processed: true } : entry));

        reviewExpenseModal.close();
    }

    const setModalParameters = (group?: SplitwiseGroup, expense?: WithId<DraftEntry>) => {
        let params: ExpenseModalParams = {
            groupId: group?.id,
            name: group?.name,
            avatarLink: group?.avatar,
            dateTime: dayjs(Date.now()).format('YYYY-MM-DDTHH:mm'),
            location: 'Manual Entry',
            description: '',
            amount: '',
            shared: !(['0', '-1'].includes(document.getElementById(`group-${group?.id}`)?.dataset['isShared'] ?? '0')),
            parties: groups.content.find(item => item.id === group?.id)?.members.map(item => (item.id))
        };

        params = expense ? {
            ...params,
            expenseId: expense._id,
            dateTime: dayjs(expense.dateTime).format('YYYY-MM-DDTHH:mm'),
            location: expense.location
        } : params;

        expenseModal.setParams(params);
    }

    const onSubmit = async () => {
        isExpenseSaving.set(true);
        const formData = {
            ...PostParams,
            body: JSON.stringify({
                cost: expenseModal.params?.amount,
                description: expenseModal.params?.description,
                details: expenseModal.params?.location,
                group_id: expenseModal.params?.groupId,
                date: expenseModal.params?.dateTime,
                shared: expenseModal.params?.shared,
                parties: expenseModal.params?.parties
            })
        };

        await fetch(Url.SplitWiseExpenses, formData)
            .then(handleResponse)
            .then(() => deleteDraftEntry(expenseModal.params?.expenseId))
            .then(() => (fetch(`${Url.SplitWiseGroup}/${expenseModal.params?.groupId}`)
                .then(handleJsonResponse)
                .then(SplitwiseGroupMapper)
                .then(data => groups.setContent(groups.content.map(item => item.id === expenseModal.params?.groupId ? data : item)))
                .then(onExpenseModalClose)
                .catch(handleError)))
            .then(() => toast.success("Expense Created Successfully!"))
            .catch(handleError)
            .finally(() => isExpenseSaving.set(false));
    }

    const deleteDraftEntry = (id?: string) => {
        if (id) {
            draftEntries.setContent(draftEntries.content.filter(expense => (expense._id !== id)));
            return fetch(`${Url.DraftExpenses}/${id}`, { method: 'DELETE' })
                .then(() => refinementDate.set((new Date().getTime())))
                .catch(handleError);
        }
    }

    const loadBankEntries = () => {
        fetch(Url.BankStatement)
            .then(handleJsonResponse)
            .then(bankEntries.setContent)
            .catch(handleError)
            .finally(bankEntries.stopLoading);
    }

    const loadPhonePeEntries = () => {
        fetch(Url.PhonePeStatement)
            .then(handleJsonResponse)
            .then(phonepeEntries.setContent)
            .catch(handleError)
            .finally(phonepeEntries.stopLoading);
    }

    const loadDraftEntries = () => {
        fetch(Url.DraftExpenses)
            .then(handleJsonResponse)
            .then(draftEntries.setContent)
            .catch(handleError)
            .finally(draftEntries.stopLoading);
    }

    const loadGroups = () => {
        fetch(Url.SplitWiseGroups)
            .then(handleJsonResponse)
            .then(SplitwiseGroupsMapper)
            .then(groups.setContent)
            .catch(handleError)
            .finally(groups.stopLoading)
    }

    const getRefinementDate = () => {
        fetch(Url.ExpenseLastRefinement)
            .then(handleJsonResponse)
            .then(({ value }) => refinementDate.set(value))
            .catch(handleError);
    }

    const loadDescriptions = () => {
        fetch(Url.ExpenseDescriptions)
            .then(handleJsonResponse)
            .then(response => descriptions.setContent(response.value.map((item: string, index: number) => ({ key: `desc-${index}`, text: item, value: item }))))
            .catch(handleError)
            .finally(descriptions.stopLoading);
    }

    const onAddItem = (data: DropdownProps) => {
        descriptions.setContent([...descriptions.content, {
            key: `desc-${descriptions.content.length}`,
            text: capitalize(data.value as string),
            value: capitalize(data.value as string)
        }]);
        expenseModal.setParams({ ...expenseModal.params, description: capitalize(data.value as string) });
        fetch(Url.AddDescriptions, { ...PostParams, body: JSON.stringify({ item: capitalize(data.value as string) }) });
    }

    const bankTxnVisibilty = ReactState(false);
    const phonePeTxnVisibilty = ReactState(false);
    const draftTxnVisibilty = ReactState(false);

    useEffect(() => {
        loadDraftEntries();
        loadBankEntries();
        loadPhonePeEntries();
        loadDescriptions();
        loadGroups();
        getRefinementDate();
    }, [])


    return (
        <Div className='expense-wrapper'>
            <Div>
                <Div className='splitwise-wrapper'>
                    <Header as='h3'>Splitwise Groups</Header>
                    <Div className='section-right'>
                        <Header as='h5'>
                            <Icon name='time' />{getDateTime(refinementDate.get())}
                        </Header>
                        <FileUpload />
                    </Div>
                </Div>

                {groups.isLoading ? (
                    <Grid>
                        {new Array(8).fill(0).map((_, index) => (
                            <Grid.Column width={2} key={`group-loader-${index}`}>
                                <Segment className='group-card-loading'>
                                    <Placeholder>
                                        <PlaceholderImage />
                                        <PlaceholderParagraph>
                                            <PlaceholderLine length='medium' />
                                        </PlaceholderParagraph>
                                    </Placeholder>
                                </Segment>
                            </Grid.Column>
                        ))}
                    </Grid>
                ) : (
                    <Grid>
                        {groups.content.map((item) => (
                            <Grid.Column computer={2} key={`group-${item.id}`}>
                                <GroupCard
                                    id={item.id}
                                    imageSrc={item.avatar}
                                    name={item.name}
                                    due={item.due}
                                    onClick={onGroupClick}
                                    getSharing={true}
                                />
                            </Grid.Column>
                        ))}
                    </Grid>
                )}
            </Div>
            <Div>
                <Grid columns={3} celled className='multi-list'>
                    <GridRow>
                        <GridColumn>
                            <Header as='h3' textAlign='left'>Bank Transactions</Header>
                            <Segment>
                                <Checkbox
                                    slider
                                    label={<label>Show Processed Entry</label>}
                                    onChange={(event, data) => bankTxnVisibilty.set(data.checked as boolean)}
                                />
                            </Segment>
                            <Div className='list-scrollable'>
                                {bankEntries.isLoading &&
                                    <Loader active inline='centered' />
                                }
                                <TransitionGroup duration={500} animation='fade'>
                                    <EmptyList isEmpty={!bankEntries.isLoading && bankEntries.content.length < 1} message='No Bank Transaction.' />
                                    {!bankEntries.isLoading && bankEntries.content.length > 0 && bankEntries.content.map(item => (
                                        (bankTxnVisibilty.get() || !item.processed) &&
                                        <Segment
                                            key={item._id}
                                            className='list-item'
                                            onClick={() => {
                                                reviewExpenseModal.setParams({ currentItem: item._id });
                                                reviewExpenseModal.open();
                                            }}
                                        >
                                            <BankItem {...item} />
                                        </Segment>
                                    ))}
                                </TransitionGroup>
                            </Div>
                        </GridColumn>
                        <GridColumn>
                            <Header as='h3' textAlign='left'>PhonePe Transactions</Header>
                            <Segment>
                                <Checkbox
                                    slider
                                    label={<label>Show Processed Entry</label>}
                                    onChange={(event, data) => phonePeTxnVisibilty.set(data.checked as boolean)}
                                />
                            </Segment>
                            <Div className='list-scrollable'>
                                {phonepeEntries.isLoading &&
                                    <Loader active inline='centered' />
                                }
                                <TransitionGroup duration={500} animation='fade'>
                                    <EmptyList isEmpty={!phonepeEntries.isLoading && phonepeEntries.content.length < 1} message='No PhonePe Transaction.' />
                                    {!phonepeEntries.isLoading && phonepeEntries.content.length > 0 && phonepeEntries.content.map(item => (
                                        (phonePeTxnVisibilty.get() || !item.processed) &&
                                        <Segment key={item._id} className='list-item'>
                                            <PhonePeItem {...item} />
                                        </Segment>
                                    ))}
                                </TransitionGroup>
                            </Div>
                        </GridColumn>
                        <GridColumn>
                            <Header as='h3' textAlign='left'>Draft Transactions</Header>
                            <Segment>
                                <Checkbox
                                    slider
                                    label={<label>Show Processed Entry</label>}
                                    onChange={(event, data) => draftTxnVisibilty.set(data.checked as boolean)}
                                />
                            </Segment>

                            <Div className='list-scrollable'>
                                {draftEntries.isLoading &&
                                    <Loader active inline='centered' />
                                }
                                <TransitionGroup duration={500} animation='fade'>
                                    <EmptyList isEmpty={!draftEntries.isLoading && draftEntries.content.length < 1} message='No Draft Expense.' />
                                    {!draftEntries.isLoading && draftEntries.content.length > 0 && draftEntries.content.map(item => (
                                        (draftTxnVisibilty.get() || !item.processed) &&
                                        <Segment key={`key-${item._id}`} className='list-item' style={{ display: item.processed ? 'none' : 'inline' }}>
                                            <ExpenseItem {...item} onDelete={deleteDraftEntry} />
                                        </Segment>
                                    ))}
                                </TransitionGroup>
                            </Div>
                        </GridColumn>
                    </GridRow>
                </Grid>
            </Div>

            <Modal onClose={onExpenseModalClose} onOpen={expenseModal.open} open={expenseModal.isOpen} className='add-expense-modal'>
                <Modal.Header>
                    <Div className='d-flex'>
                        <Image size='mini' circular src={expenseModal.params?.avatarLink} />
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>Add Expense to SplitWise</div>
                    </Div>
                </Modal.Header>
                <Modal.Content>
                    <div style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '240px', marginBottom: '4px' }}>{expenseModal.params?.name}</div>
                            <div style={{ fontSize: '16px', color: 'grey' }}>{expenseModal.params?.location}</div>
                            <div style={{ padding: '10px' }}>
                                <Form id='expense-form' onSubmit={onSubmit} loading={isExpenseSaving.get()}>
                                    <Form.Input
                                        fluid
                                        required
                                        type='datetime-local'
                                        value={expenseModal.params?.dateTime}
                                        onChange={e => expenseModal.setParams({ ...expenseModal.params, dateTime: e.target.value })}
                                    />
                                    <Form.Dropdown
                                        search
                                        fluid
                                        selection
                                        allowAdditions
                                        additionPosition='bottom'
                                        placeholder='Description'
                                        options={descriptions.content}
                                        value={expenseModal.params?.description}
                                        loading={descriptions.isLoading}
                                        selectOnBlur={false}
                                        onChange={(_, data) => expenseModal.setParams({ ...expenseModal.params, description: data.value as string })}
                                        onAddItem={(_, data) => onAddItem(data)}
                                    />
                                    <Form.Input
                                        fluid
                                        required
                                        type='number'
                                        placeholder='Amount'
                                        value={expenseModal.params?.amount}
                                        onChange={e => expenseModal.setParams({ ...expenseModal.params, amount: e.target.value })}
                                    />
                                    <Segment padded size='mini' className='radio-segment'>
                                        <Label attached='top'>Split Amount</Label>
                                        <div className='form-radio-container'>
                                            <Form.Radio
                                                fluid
                                                label='Self Paid'
                                                size='small'
                                                value='false'
                                                name='shared'
                                                checked={!expenseModal.params?.shared}
                                                onChange={onCheckedChanged}
                                            />
                                            <Form.Radio
                                                fluid
                                                label='Split Equally'
                                                size='small'
                                                value='true'
                                                name='shared'
                                                checked={expenseModal.params?.shared}
                                                onChange={onCheckedChanged}
                                            />
                                        </div>
                                    </Segment>
                                </Form>
                            </div>
                        </div>
                    </div>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={expenseModal.close}>Cancel</Button>
                    <Button positive type='submit' form='expense-form'>Ok</Button>
                </Modal.Actions>
            </Modal >

            <Modal onClose={reviewExpenseModal.close} onOpen={reviewExpenseModal.open} open={reviewExpenseModal.isOpen} className='add-expense-modal huge'>
                <Modal.Header>Review Bank Transaction</Modal.Header>
                <Modal.Content>
                    <ModalContent {...{
                        id: reviewExpenseModal.params.currentItem,
                        bankEntries: bankEntries.content,
                        phonePeEntries: phonepeEntries.content,
                        draftEntries: draftEntries.content,
                        groups: groups.content,
                        onCompletion: onReviewComplete
                    }} />
                </Modal.Content>
            </Modal>
        </Div>
    )
}

const ModalContent: React.FC<React.PropsWithChildren & ReviewModalParams> = ({ id, bankEntries, phonePeEntries, draftEntries, groups, onCompletion }) => {
    const bankEntry = bankEntries.find(entry => entry._id === id);
    const phonePeMatches = getPhonePeMatches(bankEntry, phonePeEntries);
    const draftMatches = ReactState<WithId<DraftEntry>[]>([]);

    const reviewModalParam = ReactState<any>({
        amount: bankEntries.find(entry => entry._id === id)?.amount,
        phonePeTxn: null,
        draftTxn: null
    });

    const onPhonepeChecked = (_: React.MouseEvent<HTMLInputElement>, data: CheckboxProps) => {
        const selectedPhonePeEntry = phonePeMatches.find(t => t._id === (data.id as string));
        reviewModalParam.set({
            ...reviewModalParam.get(),
            selectedPhonePe: selectedPhonePeEntry,
            selectedDraft: null,
        });

        draftMatches.set(getDraftMatches(selectedPhonePeEntry, draftEntries))
    }

    const onDraftChecked = (_: React.MouseEvent<HTMLInputElement>, data: CheckboxProps) => {
        reviewModalParam.set({
            ...reviewModalParam.get(),
            selectedDraft: draftMatches.get().find(t => t._id === (data.id as string))
        });
    }

    const descriptions = ContentState<Array<SelectOption>>([]);
    const onAddItem = (data: DropdownProps) => {
        descriptions.setContent([...descriptions.content, {
            key: `desc-${descriptions.content.length}`,
            text: capitalize(data.value as string),
            value: capitalize(data.value as string)
        }]);
        reviewModalParam.set({ ...reviewModalParam.get(), description: capitalize(data.value as string) });
        fetch(Url.AddDescriptions, { ...PostParams, body: JSON.stringify({ item: capitalize(data.value as string) }) });
    }

    const loadDescriptions = () => {
        fetch(Url.ExpenseDescriptions)
            .then(handleJsonResponse)
            .then(response => descriptions.setContent(response.value.map((item: string, index: number) => ({ key: `desc-${index}`, text: item, value: item }))))
            .catch(handleError)
            .finally(descriptions.stopLoading);
    }

    const approveTransaction = async (groupId: number) => {
        let sharingStatus = false;

        await fetch(`${Url.ExpenseGroups}/${id}/sharedStatus`)
            .then(response => {
                handleResponse(response, 'Group Details Not Available!');
                return response.json();
            })
            .then(({ isShared }) => { sharingStatus = isShared })
            .catch((e) => console.log(e.message));

        const formData = {
            ...PostParams,
            body: JSON.stringify({
                group_id: groupId,
                details: Object.entries({
                    Bank: `${bankEntry?.bank}`,
                    Description: `${bankEntry?.description}`,
                    UTR: `${reviewModalParam.get().selectedPhonePe?.utr ?? 'N/A'}`,
                    TransactionNo: `${reviewModalParam.get().selectedPhonePe?.transactionId ?? 'N/A'}`,
                    Recipient: `${reviewModalParam.get().selectedPhonePe?.recipient ?? 'N/A'}`,
                    Location: `${reviewModalParam.get().selectedDraft?.location?.replaceAll('\n', ', ') ?? 'N/A'}`,
                    Coordinates: reviewModalParam.get().selectedDraft?.coordinate ? `https://www.google.com/maps?q=${reviewModalParam.get().selectedDraft?.coordinate}` : 'N/A'
                }).map(([k, v]) => `${k} : ${v}\n——————`).join('\n'),
                description: reviewModalParam.get().description,
                cost: reviewModalParam.get().amount,
                date: reviewModalParam.get().date,
                parties: groups.find(t => t.id === groupId)?.members.map(m => m.id),
                shared: sharingStatus,
                bankTxnId: bankEntry?._id,
                phonePeTxnId: reviewModalParam.get().selectedPhonePe?._id,
                draftTxnId: reviewModalParam.get().selectedDraft?._id
            })
        };

        await fetch(Url.FinalizeExpense, formData)
            .then(handleResponse)
            //.then(() => deleteDraftEntry(expenseModal.params?.expenseId))
            // .then(() => (fetch(`${Url.SplitWiseGroup}/${expenseModal.params?.groupId}`)
            //     .then(handleJsonResponse)
            //     .then(SplitwiseGroupMapper)
            //     .then(data => groups.setContent(groups.content.map(item => item.id === expenseModal.params?.groupId ? data : item)))
            //     .then(onExpenseModalClose)
            //     .catch(handleError)))
            .then(onComplete)
            .catch(handleError)
    }

    const onComplete = () => {
        toast.success("Expense Created Successfully!");

        onCompletion({
            bankTransactionId: `${bankEntry?._id}`,
            phonePeTransactionId: `${reviewModalParam.get().selectedPhonePe?._id}`,
            draftTransactionId: `${reviewModalParam.get().selectedDraft?._id}`
        });
    }

    useEffect(() => {
        reviewModalParam.set({
            ...reviewModalParam.get(),
            amount: bankEntry?.amount,
            date: bankEntry?.date
        });

        loadDescriptions();
    }, [])

    return (
        <Div>
            <Grid columns={3} celled className='multi-list'>
                <GridRow>
                    <GridColumn>
                        <Header>Bank Transaction</Header>
                        <Segment className='list-item'>
                            {bankEntry && <BankItem {...bankEntry} />}
                        </Segment>
                    </GridColumn>
                    <GridColumn>
                        <Header>PhonePe Transactions</Header>
                        <EmptyList isEmpty={phonePeMatches.length < 1} message='No Transaction Identified.' />
                        {phonePeMatches.map(item => (
                            <Segment className='list-item'>
                                <Div className='d-flex' style={{ alignItems: 'center' }}>
                                    <Radio
                                        name='radio-phonepe'
                                        id={item._id}
                                        style={{ marginRight: '0.5em' }}
                                        onClick={onPhonepeChecked}
                                        checked={item._id === reviewModalParam.get().selectedPhonePe?._id}
                                    />
                                    <PhonePeItem {...item} />
                                </Div>
                            </Segment>
                        ))}
                    </GridColumn>
                    <GridColumn>
                        <Header>Draft Transactions</Header>
                        <EmptyList isEmpty={draftMatches.get().length < 1} message='No Transaction Identified.' />
                        {draftMatches.get().map(item => (
                            <Segment className='list-item'>
                                <Div className='d-flex' style={{ alignItems: 'center' }}>
                                    <Radio
                                        name='radio-draft'
                                        id={item._id}
                                        style={{ marginRight: '0.5em' }}
                                        onClick={onDraftChecked}
                                        checked={item._id === reviewModalParam.get().selectedDraft?._id}
                                    />
                                    <ExpenseItem {...item} />
                                </Div>
                            </Segment>
                        ))}
                    </GridColumn>
                </GridRow>
            </Grid>
            <Table celled striped>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell width={1}>Date</TableHeaderCell>
                        <TableHeaderCell width={7}>Description</TableHeaderCell>
                        <TableHeaderCell width={2}>UTR / Transaction #</TableHeaderCell>
                        <TableHeaderCell width={2}>Recipient</TableHeaderCell>
                        <TableHeaderCell width={3}>Location</TableHeaderCell>
                        <TableHeaderCell width={1}>Bank</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <TableRow>
                        <TableCell verticalAlign='top'>
                            {dayjs(bankEntry?.date).format('DD/MMM/YYYY')}<br />
                            {reviewModalParam.get().selectedPhonePe?.date && dayjs(reviewModalParam.get().selectedPhonePe?.date).format('hh:mm A')}
                        </TableCell>
                        <TableCell verticalAlign='top'>{bankEntry?.description}</TableCell>

                        <TableCell verticalAlign='top' singleLine>
                            {reviewModalParam.get().selectedPhonePe && <List>
                                <ListItem>
                                    <Icon name='triangle right' color='grey' />
                                    {reviewModalParam.get().selectedPhonePe?.utr}
                                </ListItem>
                                <ListItem>
                                    <Icon name='triangle right' color='grey' />
                                    {reviewModalParam.get().selectedPhonePe?.transactionId}
                                </ListItem>
                            </List>}
                        </TableCell>
                        <TableCell verticalAlign='top'>{reviewModalParam.get().selectedPhonePe?.recipient.toUpperCase()}</TableCell>
                        <TableCell verticalAlign='top'>{reviewModalParam.get().selectedDraft?.location}</TableCell>
                        <TableCell verticalAlign='top'>{bankEntry?.bank}</TableCell>
                    </TableRow>
                </TableBody>
                <TableFooter>
                    <TableRow>
                        <TableHeaderCell colSpan={3} />
                        <TableHeaderCell textAlign='center'>
                            <Input
                                label={{ basic: true, content: '₹' }}
                                placeholder='Amount'
                                type='number'
                                value={reviewModalParam.get().amount}
                                onChange={(_, props) => reviewModalParam.set({ ...reviewModalParam.get(), amount: parseInt(props.value) })}
                                className={`text-${bankEntry?.type.toLowerCase()} input-amount`}
                                fluid
                            />
                        </TableHeaderCell>
                        <TableHeaderCell>
                            <Form.Dropdown
                                search
                                fluid
                                selection
                                allowAdditions
                                additionPosition='bottom'
                                placeholder='Description'
                                options={descriptions.content}
                                value={reviewModalParam.get().description}
                                loading={descriptions.isLoading}
                                selectOnBlur={false}
                                onChange={(_, data) => reviewModalParam.set({ ...reviewModalParam.get(), description: data.value as string })}
                                onAddItem={(_, data) => onAddItem(data)}
                            />
                        </TableHeaderCell>
                        <TableHeaderCell textAlign='center'>
                            <Popup trigger={<Button color='green' fluid disabled={!Boolean(reviewModalParam.get().description)}>Approve</Button>} on='click' position='top right' pinned>
                                <Div className='floating-group-container'>
                                    {groups.map((item) => (
                                        <GroupCard
                                            id={item.id}
                                            imageSrc={item.avatar}
                                            name={item.name}
                                            due={item.due}
                                            getSharing={false}
                                            onClick={() => approveTransaction(item.id)}
                                        />
                                    ))}
                                </Div>
                            </Popup>
                        </TableHeaderCell>
                    </TableRow>
                </TableFooter>
            </Table>
        </Div>
    );
}

const EmptyList: React.FC<React.PropsWithChildren & { message: string, isEmpty: boolean }> = ({ message, isEmpty }) => (
    isEmpty ? <Segment textAlign='center'><h4>{message}</h4></Segment> : <></>
)
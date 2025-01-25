import dayjs from 'dayjs';
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { Divider, Grid, Header, Segment, Image, Button, Modal, Loader, Form, Label, RadioProps, DropdownProps, Container, Icon } from "semantic-ui-react"
import { ModalParams, RawExpense, SelectOption, SplitwiseGroup } from "../common/types";
import { PostParams, Url } from "../common/constants";
import { SplitwiseGroupMapper, SplitwiseGroupsMapper, capitalize, getDateTime, handleError, handleJsonResponse, handleResponse } from "../operations/utils";
import { ExpenseItem, GroupCard } from "../common/components";

export const Expense: React.FC = () => {
    const [expenses, setExpenses] = useState<Array<RawExpense>>([]);
    const [groups, setGroups] = useState<Array<SplitwiseGroup>>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [expenseLoading, setExpenseLoading] = useState(true);
    const [expenseSaving, setExpenseSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [modalParams, setModalParams] = useState<ModalParams>();
    const [refinementDate, setRefinementDate] = useState(1);
    const [descriptions, setDescriptions] = useState<SelectOption[]>([]);
    const [descriptionLoading, setDescriptionLoading] = useState(true);

    const onCheckedChanged = (_: any, { name, value }: RadioProps) =>
        setModalParams({ ...modalParams, [name as string]: JSON.parse(value as string) });

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData('text/plain', JSON.stringify({ id: e.currentTarget.id, class: e.currentTarget.className }));
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = 'lightgray';
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = 'white';
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = 'white';
        try {
            const sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (sourceData.class.includes('list-item')) {
                const group = groups.find(group => group.id.toString() === e.currentTarget.id);
                const expense = expenses.find(expense => expense._id === sourceData.id);
                setModalParameters(group, expense)
                setOpen(true);
            }
        }
        catch { console.log('Invalid Drop, Skipping...'); }
    };

    const onModalClose = () => {
        setModalParams({});
        setOpen(false);
    }

    const onGroupClick = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        const group = groups.find(group => group.id.toString() === e.currentTarget.id);
        setModalParameters(group);
        setOpen(true);
    }

    const setModalParameters = (group?: SplitwiseGroup, expense?: RawExpense) => {
        let params: ModalParams = {
            groupId: group?.id,
            name: group?.name,
            avatarLink: group?.avatar,
            dateTime: dayjs(Date.now()).format('YYYY-MM-DDTHH:mm'),
            location: 'Manual Entry',
            description: '',
            amount: '',
            shared: !(['0', '-1'].includes(document.getElementById(`group-${group?.id}`)?.dataset['isShared'] ?? '0')),
            parties: groups.find(item => item.id === group?.id)?.members.map(item => (item.id))
        };

        params = expense ? {
            ...params,
            expenseId: expense._id,
            dateTime: dayjs(expense.dateTime).format('YYYY-MM-DDTHH:mm'),
            location: expense.location
        } : params;

        setModalParams(params);
    }

    const onSubmit = () => {
        setExpenseSaving(true);
        const formData = {
            ...PostParams,
            body: JSON.stringify({
                cost: modalParams?.amount,
                description: modalParams?.description,
                details: modalParams?.location,
                group_id: modalParams?.groupId,
                date: modalParams?.dateTime,
                shared: modalParams?.shared,
                parties: modalParams?.parties
            })
        };

        fetch(Url.SplitWiseExpenses, formData)
            .then(handleResponse)
            .then(() => deleteExpense(modalParams?.expenseId))
            .then(() => (fetch(`${Url.SplitWiseGroup}/${modalParams?.groupId}`)
                .then(handleJsonResponse)
                .then(SplitwiseGroupMapper)
                .then(data => setGroups(groups.map(item => item.id === modalParams?.groupId ? data : item)))
                .then(onModalClose)
                .catch(handleError)))
            .then(() => toast.success("Expense Created Successfully!"))
            .catch(handleError)
            .finally(() => setExpenseSaving(false));
    }

    const deleteExpense = (id?: string) => {
        if (id) {
            setExpenses(expenses.filter(expense => (expense._id !== id)));
            return fetch(`${Url.DraftExpenses}/${id}`, { method: 'DELETE' })
                .then(() => setRefinementDate((new Date().getTime())))
                .catch(handleError);
        }
    }

    const loadRawTransactions = () => {
        fetch(Url.DraftExpenses)
            .then(handleJsonResponse)
            .then(setExpenses)
            .catch(handleError)
            .finally(() => setExpenseLoading(false));
    }

    const loadGroups = () => {
        fetch(Url.SplitWiseGroups)
            .then(handleJsonResponse)
            .then(SplitwiseGroupsMapper)
            .then(setGroups)
            .catch(handleError)
            .finally(() => setGroupsLoading(false));
    }

    const getRefinementDate = () => {
        fetch(Url.ExpenseLastRefinement)
            .then(handleJsonResponse)
            .then(response => setRefinementDate(response.value))
            .catch(handleError);
    }

    const loadDescriptions = () => {
        setDescriptionLoading(true);
        fetch(Url.ExpenseDescriptions)
            .then(handleJsonResponse)
            .then(response => setDescriptions(response.value.map((item: string, index: number) => ({ key: `desc-${index}`, text: item, value: item }))))
            .catch(handleError)
            .finally(() => setDescriptionLoading(false));
    }

    const onAddItem = (data: DropdownProps) => {
        setDescriptions([...descriptions, {
            key: `desc-${descriptions.length}`,
            text: capitalize(data.value as string),
            value: capitalize(data.value as string)
        }]);
        setModalParams({ ...modalParams, description: capitalize(data.value as string) });
        fetch(Url.AddDescriptions, { ...PostParams, body: JSON.stringify({ item: capitalize(data.value as string) }) });
    }

    useEffect(() => {
        loadRawTransactions();
        loadGroups();
        getRefinementDate();
        loadDescriptions();
    }, [])


    return (
        <>
            <Segment basic>
                <Grid columns={2}>
                    <Grid.Column className='list-transactions'>
                        <Header as='h2' textAlign='center'>Transactions</Header>
                        <Container className='list-scrollable'>
                            {expenseLoading && <Loader active inline='centered' />}
                            {!expenseLoading && expenses.length < 1 && <Segment textAlign='center' className='list-item'><h4>No Expense To Show.</h4></Segment>}
                            {!expenseLoading && expenses.map(item => (
                                <Segment
                                    id={item._id}
                                    className='list-item'
                                    key={`list-${item._id}`}
                                    draggable
                                    onDragStart={handleDragStart}
                                >
                                    <ExpenseItem {...item} onDelete={deleteExpense} />
                                </Segment>
                            ))}
                        </Container>
                    </Grid.Column>
                    <Grid.Column className='list-groups'>
                        <Header as='h2' textAlign='center'>Splitwise</Header>
                        {groupsLoading && <Loader active inline='centered' />}
                        <Grid>
                            {groups.map((item, index) => (
                                <Grid.Column mobile={16} tablet={8} computer={4} key={`group-${index}`}>
                                    <GroupCard
                                        id={item.id}
                                        imageSrc={item.avatar}
                                        name={item.name}
                                        due={item.due}
                                        onDragLeave={handleDragLeave}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        onClick={onGroupClick}
                                    />
                                </Grid.Column>
                            ))}
                        </Grid>
                        <Divider horizontal section>
                            <Header as='h5'>
                                <Icon name='time' />
                                {getDateTime(refinementDate)}
                            </Header>
                        </Divider>
                    </Grid.Column>
                </Grid>
            </Segment>
            <Modal onClose={onModalClose} onOpen={() => setOpen(true)} open={open} className='add-expense-modal'>
                <Modal.Header>
                    <div style={{ display: 'flex' }}>
                        <Image size='mini' circular src={modalParams?.avatarLink} />
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>Add Expense To SplitWise</div>
                    </div>
                </Modal.Header>
                <Modal.Content>
                    <div style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '240px', marginBottom: '4px' }}>{modalParams?.name}</div>
                            <div style={{ fontSize: '16px', color: 'grey' }}>{modalParams?.location}</div>
                            <div style={{ padding: '10px' }}>
                                <Form id='expense-form' onSubmit={onSubmit} loading={expenseSaving}>
                                    <Form.Input
                                        fluid
                                        required
                                        type='datetime-local'
                                        value={modalParams?.dateTime}
                                        onChange={e => setModalParams({ ...modalParams, dateTime: e.target.value })}
                                    />
                                    <Form.Dropdown
                                        search
                                        fluid
                                        selection
                                        allowAdditions
                                        additionPosition='bottom'
                                        placeholder='Description'
                                        options={descriptions}
                                        value={modalParams?.description}
                                        loading={descriptionLoading}
                                        selectOnBlur={false}
                                        onChange={(_, data) => setModalParams({ ...modalParams, description: data.value as string })}
                                        onAddItem={(_, data) => onAddItem(data)}
                                    />
                                    <Form.Input
                                        fluid
                                        required
                                        type='number'
                                        placeholder='Amount'
                                        value={modalParams?.amount}
                                        onChange={e => setModalParams({ ...modalParams, amount: e.target.value })}
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
                                                checked={!modalParams?.shared}
                                                onChange={onCheckedChanged}
                                            />
                                            <Form.Radio
                                                fluid
                                                label='Split Equally'
                                                size='small'
                                                value='true'
                                                name='shared'
                                                checked={modalParams?.shared}
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
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button positive type='submit' form='expense-form'>Ok</Button>
                </Modal.Actions>
            </Modal >
        </>
    )
}
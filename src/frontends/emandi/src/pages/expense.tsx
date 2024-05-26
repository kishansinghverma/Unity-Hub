import dayjs from 'dayjs';
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { Card, Divider, Grid, Header, Segment, Image, Button, Modal, Loader, Form } from "semantic-ui-react"
import { ModalParams, RawExpense, SplitwiseGroup } from "../common/types";
import { PostParams, Url } from "../common/constants";
import { SplitwiseGroupMapper, SplitwiseGroupsMapper, handleError, handleJsonResponse, handleResponse } from "../operations/utils";
import { ExpenseItem, GroupCard } from "../common/components";

export const Expense: React.FC = () => {
    const [expenses, setExpenses] = useState<Array<RawExpense>>([]);
    const [groups, setGroups] = useState<Array<SplitwiseGroup>>([]);
    const [groupsLoading, setGroupsLoading] = useState(true);
    const [expenseLoading, setExpenseLoading] = useState(true);
    const [expenseSaving, setExpenseSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [modalParams, setModalParams] = useState<ModalParams>();

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
            amount: ''
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
                date: modalParams?.dateTime
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
            setExpenseLoading(true);
            return fetch(`${Url.DraftExpenses}/${id}`, {method: 'DELETE'})
                .then(loadRawTransactions)
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

    useEffect(() => {
        loadRawTransactions();
        loadGroups();
    }, [])


    return (
        <>
            <Segment basic>
                <Grid columns={2}>
                    <Divider vertical style={{ paddingLeft: '3px' }}>❤️</Divider>
                    <Grid.Column style={{ paddingRight: '32px' }}>
                        <Header as='h2' textAlign='center'>Transactions</Header>
                        {expenseLoading && <Loader active inline='centered' />}
                        {!expenseLoading && expenses.length < 1 && <Segment textAlign='center' className='list-item'><h4>No Expense To Show.</h4></Segment>}
                        {!expenseLoading && expenses.map((item, index) => (
                            <Segment
                                id={item._id}
                                className='list-item'
                                key={`list-${index}`}
                                draggable
                                onDragStart={handleDragStart}
                            >
                                <ExpenseItem {...item} onDelete={deleteExpense} />
                            </Segment>
                        ))}
                    </Grid.Column>
                    <Grid.Column style={{ paddingLeft: '32px' }}>
                        <Header as='h2' textAlign='center'>Splitwise</Header>
                        {groupsLoading && <Loader active inline='centered' />}
                        <Grid>
                            {groups.map((item, index) => (
                                <Grid.Column mobile={16} tablet={8} computer={4} key={`group-${index}`}>
                                    <Card
                                        id={item.id}
                                        raised
                                        onDragLeave={handleDragLeave}
                                        onDragOver={handleDragOver}
                                        onDrop={handleDrop}
                                        onClick={onGroupClick}
                                        style={{ userSelect: 'none' }}
                                    >
                                        <GroupCard ImageSrc={item.avatar} Name={item.name} Info={`Due : ${item.due}`} />
                                    </Card>
                                </Grid.Column>
                            ))}
                        </Grid>
                    </Grid.Column>
                </Grid>
            </Segment>
            <Modal onClose={onModalClose} onOpen={() => setOpen(true)} open={open} >
                <Modal.Header>
                    <div style={{ display: 'flex' }}>
                        <Image size='mini' circular src={modalParams?.avatarLink} />
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '10px' }}>Add Expense To SplitWise</div>
                    </div>
                </Modal.Header>
                <Modal.Content>
                    <div style={{ display: 'flex', justifyContent: 'center', textAlign: 'center' }}>
                        <div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', minWidth: '240px' }}>{modalParams?.name}</div>
                            <div style={{ fontSize: '16px' }}>{modalParams?.location}</div>
                            <div style={{ padding: '10px' }}>
                                <Form id='expense-form' onSubmit={onSubmit} loading={expenseSaving}>
                                    <Form.Input
                                        fluid
                                        required
                                        type='datetime-local'
                                        size='small'
                                        value={modalParams?.dateTime}
                                        onChange={e => setModalParams({ ...modalParams, dateTime: e.target.value })}
                                    />
                                    <Form.Input
                                        fluid
                                        required
                                        placeholder='Description'
                                        size='small'
                                        style={{ margin: '8px 0px' }}
                                        value={modalParams?.description}
                                        onChange={e => setModalParams({ ...modalParams, description: e.target.value })}
                                    />
                                    <Form.Input
                                        fluid
                                        required
                                        type='number'
                                        placeholder='Amount'
                                        size='small'
                                        value={modalParams?.amount}
                                        onChange={e => setModalParams({ ...modalParams, amount: e.target.value })}
                                    />
                                </Form>
                            </div>
                        </div>
                    </div>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={() => setOpen(false)}>Cancel</Button>
                    <Button positive type='submit' form='expense-form'>Ok</Button>
                </Modal.Actions>
            </Modal>
        </>
    )
}
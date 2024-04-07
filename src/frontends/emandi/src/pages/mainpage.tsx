import { BaseSyntheticEvent, useState } from "react";
import { Segment, Menu, Dropdown, DropdownMenu } from "semantic-ui-react";
import { MenuItemProps } from "semantic-ui-react/dist/commonjs/collections/Menu/MenuItem";
import { NewEntry } from "./newentry";
import { NewParty } from "./newparty";
import { ProcessedPage } from "./processed";
import { QueuedPage } from "./queued";
import { Expense } from "./expense";
import { Parties } from "./parties";
import { PageTitle } from "../common/constants";

export const MainPage = () => {
    const pageMap: { [key: string]: JSX.Element } = {
        [PageTitle.NewEntry]: <NewEntry />,
        [PageTitle.AddParty]: <NewParty />,
        [PageTitle.Queued]: <QueuedPage />,
        [PageTitle.Processed]: <ProcessedPage />,
        [PageTitle.Parties]: <Parties />,
        [PageTitle.Expenses]: <Expense />
    }

    const [selectedItem, setSelectedItem] = useState<string | undefined>(PageTitle.NewEntry);
    const handleClick = (event: BaseSyntheticEvent, { name }: MenuItemProps) => setSelectedItem(name);

    return (
        <>
            <Segment inverted attached>
                <Menu inverted pointing secondary size='small'>
                    <Menu.Item icon='add' name={PageTitle.NewEntry} active={selectedItem === PageTitle.NewEntry} onClick={handleClick} />
                    <Menu.Item icon='wait' name={PageTitle.Queued} active={selectedItem === PageTitle.Queued} onClick={handleClick} />
                    <Menu.Item icon='tasks' name={PageTitle.Processed} active={selectedItem === PageTitle.Processed} onClick={handleClick} />
                    <Dropdown item text='More' pointing="top right">
                        <DropdownMenu>
                            <Menu.Item icon='user plus' name={PageTitle.AddParty} active={selectedItem === PageTitle.AddParty} onClick={handleClick} />
                            <Menu.Item icon='users' name={PageTitle.Parties} active={selectedItem === PageTitle.Parties} onClick={handleClick} />
                            <Menu.Item icon='pie chart' name={PageTitle.Expenses} active={selectedItem === PageTitle.Expenses} onClick={handleClick} />
                        </DropdownMenu>
                    </Dropdown>
                </Menu>
            </Segment>
            <div className='content-container'>
                {pageMap[selectedItem as string]}
            </div>
        </>
    )
}
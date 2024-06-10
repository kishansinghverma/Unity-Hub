import { useEffect, useState } from "react";
import { Segment, Menu, Dropdown, DropdownMenu } from "semantic-ui-react";
import { pages } from "../common/constants";
import { Link, Outlet, useLocation } from "react-router-dom";

export const MainPage = () => {
    const location = useLocation();
    const isActive = (route: string) => (location.pathname.replace(/\/+$/, '') === route);

    return (
        <>
            <Segment inverted attached>
                <Menu inverted pointing secondary size='small' attached>
                    <Menu.Item icon='add' name={pages.newEntry.label} active={isActive(pages.root.route) || isActive(pages.newEntry.route)} as={Link} to={pages.newEntry.route} />
                    <Menu.Item icon='wait' name={pages.queued.label} active={isActive(pages.queued.route)} as={Link} to={pages.queued.route} />
                    <Menu.Item icon='tasks' name={pages.processed.label} active={isActive(pages.processed.route)} as={Link} to={pages.processed.route} />
                    <Dropdown item text='More' pointing="top right">
                        <DropdownMenu>
                            <Menu.Item icon='user plus' name={pages.addParty.label} active={isActive(pages.addParty.route)} as={Link} to={pages.addParty.route} />
                            <Menu.Item icon='users' name={pages.parties.label} active={isActive(pages.parties.route)} as={Link} to={pages.parties.route} />
                            <Menu.Item icon='pie chart' name={pages.expenses.label} active={isActive(pages.expenses.route)} as={Link} to={pages.expenses.route} />
                        </DropdownMenu>
                    </Dropdown>
                </Menu>
            </Segment>
            <div className='content-container'><Outlet /></div>
        </>
    )
}
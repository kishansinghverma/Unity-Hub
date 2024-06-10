import { Routes, Route, Link } from "react-router-dom";
import { Expense } from "./expense";
import { MainPage } from "./mainpage";
import { NewEntry } from "./newentry";
import { NewParty } from "./newparty";
import { Parties } from "./parties";
import { ProcessedPage } from "./processed";
import { QueuedPage } from "./queued";

export const RouterPage = () => (
    <Routes>
        <Route path="/emandi" element={<MainPage />}>
            <Route index element={<NewEntry />} />
            <Route path="new" element={<NewEntry />} />
            <Route path="queued" element={<QueuedPage />} />
            <Route path="processed" element={<ProcessedPage />} />
            <Route path="addparty" element={<NewParty />} />
            <Route path="parties" element={<Parties />} />
            <Route path="expenses" element={<Expense />} />
            <Route path="*" element={<NoMatch />} />
        </Route>
    </Routes>
);

const NoMatch = () => {
    return (
        <div>
            <h2>Nothing to see here!</h2>
            <p>
                <Link to="/">Go to the home page</Link>
            </p>
        </div>
    );
}
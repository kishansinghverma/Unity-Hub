import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertTriangle,
    Building2,
    Check,
    ChevronLeft,
    ChevronRight,
    FileBadge,
    Inbox,
    LayoutGrid,
    List,
    Loader2,
    MapPin,
    Pencil,
    Plus,
    RotateCcw,
    Route,
    Search,
    Trash2,
    X
} from "lucide-react";
import { Modal, ModalActions, ModalContent, ModalHeader } from "semantic-ui-react";
import { toast } from "react-toastify";
import { DeleteParams, pages, Url } from "../../common/constants";
import { Party, Record as WithIdRecord } from "../../common/types";
import { handleError, handleJsonResponse } from "../../operations/utils";
import { EditPartyForm } from "../editparty/editparty";
import "./parties.css";

export const Parties: React.FC = () => {
    const [records, setRecords] = useState<Array<WithIdRecord<Party>>>([]);
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [recordToEdit, setRecordToEdit] = useState<WithIdRecord<Party> | null>(null);
    const [partyToDelete, setPartyToDelete] = useState<WithIdRecord<Party> | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const pageSize = viewMode === "grid" ? 9 : 10;

    const fetchRecords = () => {
        setIsFetching(true);
        fetch(Url.Parties)
            .then((response) => handleJsonResponse<Array<WithIdRecord<Party>>>(response))
            .then((data) => {
                setRecords(data ?? []);
            })
            .catch(handleError)
            .finally(() => setIsFetching(false));
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const filteredRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return records;
        const compactQuery = query.replace(/\s+/g, "");

        return records.filter((party) => {
            const name = (party.name || "").toLowerCase();
            const mandi = (party.mandi || "").toLowerCase();
            const state = (party.state || "").toLowerCase();
            const licence = (party.licenceNumber || "").toLowerCase();

            return (
                name.includes(query) ||
                mandi.includes(query) ||
                state.includes(query) ||
                licence.includes(query) ||
                name.replace(/\s+/g, "").includes(compactQuery) ||
                mandi.replace(/\s+/g, "").includes(compactQuery)
            );
        });
    }, [records, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

    const paginatedRecords = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return filteredRecords.slice(startIndex, startIndex + pageSize);
    }, [filteredRecords, currentPage, pageSize]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(event.target.value);
        setCurrentPage(1);
    };

    const handleClearSearch = () => {
        setSearchQuery("");
        setCurrentPage(1);
    };

    const handleEditParty = (party: WithIdRecord<Party>) => {
        setRecordToEdit(party);
        setIsEditModalOpen(true);
    };

    const handlePostSuccess = (updatedRecord: WithIdRecord<Party>) => {
        setIsEditModalOpen(false);
        setRecords((prev) => prev.map((item) => (item._id === updatedRecord._id ? { ...updatedRecord } : item)));
    };

    const handleDeleteParty = () => {
        if (!partyToDelete) return;
        setIsDeleting(true);

        fetch(`${Url.Parties}/${partyToDelete._id}`, DeleteParams)
            .then((response) => handleJsonResponse<WithIdRecord<Party>>(response))
            .then(() => {
                toast.success("पार्टी सफलतापूर्वक हटा दी गई है।");
                setRecords((prev) => prev.filter((item) => item._id !== partyToDelete._id));
                setPartyToDelete(null);
            })
            .catch(handleError)
            .finally(() => setIsDeleting(false));
    };

    return (
        <div className="parties-page-wrapper">
            <header className="parties-header-card">
                <div className="parties-header-top-row">
                    <div className="parties-header-title-group">
                        <h1>पार्टियों की सूची</h1>
                        <p>पंजीकृत आढ़तिया फर्म एवं मंडी विवरण</p>
                    </div>

                    <Link to={pages.addParty.route} className="btn-parties-add">
                        <Plus size={16} />
                        <span>पार्टी</span>
                    </Link>
                </div>

                <div className="parties-header-controls">
                    <div className="parties-search-wrap">
                        <Search size={16} className="parties-search-icon" />
                        <input
                            type="text"
                            className="parties-search-input"
                            placeholder="पार्टी, मंडी, राज्य खोजें..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                className="parties-search-clear"
                                onClick={handleClearSearch}
                                title="सर्च साफ़ करें"
                            >
                                <X size={15} />
                            </button>
                        )}
                    </div>

                    <div className="parties-actions-group">
                        <div className="parties-view-toggle">
                            <button
                                type="button"
                                className={`parties-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => { setViewMode("list"); setCurrentPage(1); }}
                                title="सूची दृश्य (List View)"
                            >
                                <List size={17} />
                            </button>
                            <button
                                type="button"
                                className={`parties-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => { setViewMode("grid"); setCurrentPage(1); }}
                                title="कार्ड दृश्य (Grid View)"
                            >
                                <LayoutGrid size={17} />
                            </button>
                        </div>

                        <button
                            type="button"
                            className="btn-parties-refresh"
                            onClick={fetchRecords}
                            disabled={isFetching}
                            title="रिफ्रेश करें"
                        >
                            <RotateCcw size={16} className={isFetching ? "spin" : ""} />
                        </button>
                    </div>
                </div>
            </header>

            {isFetching && records.length === 0 ? (
                <div className="parties-empty-card">
                    <div className="parties-empty-icon">
                        <Loader2 size={32} className="spin" />
                    </div>
                    <h2 className="parties-empty-title">पार्टियां लोड हो रही हैं...</h2>
                    <p className="parties-empty-text">कृपया प्रतीक्षा करें, सर्वर से डेटा प्राप्त किया जा रहा है।</p>
                </div>
            ) : filteredRecords.length === 0 ? (
                <div className="parties-empty-card">
                    <div className="parties-empty-icon">
                        <Inbox size={32} />
                    </div>
                    <h2 className="parties-empty-title">
                        {searchQuery ? "कोई पार्टी नहीं मिली" : "अभी तक कोई पार्टी नहीं जोड़ी गई है"}
                    </h2>
                    <p className="parties-empty-text">
                        {searchQuery
                            ? `‘${searchQuery}’ से मेल खाती कोई फर्म नहीं मिली। कृपया वर्तनी जांचें या सर्च रीसेट करें।`
                            : "नई आढ़तिया फर्म एवं मंडी विवरण जोड़ने के लिए नीचे दिए गए बटन पर क्लिक करें।"}
                    </p>
                    {searchQuery ? (
                        <button type="button" className="btn-pagination" onClick={handleClearSearch}>
                            सर्च रीसेट करें
                        </button>
                    ) : (
                        <Link to={pages.addParty.route} className="btn-parties-add">
                            <Plus size={16} />
                            <span>नई पार्टी जोड़ें</span>
                        </Link>
                    )}
                </div>
            ) : viewMode === "list" ? (
                <div className="parties-table-card">
                    <div className="parties-scroll-wrap">
                        <table className="modern-parties-table">
                            <thead>
                                <tr>
                                    <th>फर्म का नाम</th>
                                    <th>मंडी</th>
                                    <th>राज्य</th>
                                    <th>दूरी (कि.मी.)</th>
                                    <th>लाइसेंस</th>
                                    <th className="center">कार्रवाई</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((record) => (
                                    <tr key={record._id}>
                                        <td>{record.name}</td>
                                        <td>{record.mandi}</td>
                                        <td>{record.state || "—"}</td>
                                        <td>{record.distance}</td>
                                        <td>{record.licenceNumber || "—"}</td>
                                        <td>
                                            <div className="party-actions-cell">
                                                <button
                                                    type="button"
                                                    className="action-icon-btn edit"
                                                    title="पार्टी संशोधित करें"
                                                    onClick={() => handleEditParty(record)}
                                                >
                                                    <Pencil size={15} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="action-icon-btn delete"
                                                    title="पार्टी हटाएं"
                                                    onClick={() => setPartyToDelete(record)}
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <footer className="parties-pagination">
                        <span className="parties-pagination-info">
                            पेज {currentPage} / {totalPages} (कुल {filteredRecords.length} में से {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)})
                        </span>
                        <div className="parties-pagination-controls">
                            <button
                                type="button"
                                className="btn-pagination"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={16} />
                                <span>पिछला</span>
                            </button>
                            <button
                                type="button"
                                className="btn-pagination"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            >
                                <span>अगला</span>
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </footer>
                </div>
            ) : (
                <>
                    <div className="parties-grid">
                        {paginatedRecords.map((record) => (
                            <div className="party-card" key={record._id}>
                                <div className="party-card-header">
                                    <div className="party-card-avatar">
                                        <Building2 size={22} />
                                    </div>
                                    <div className="party-card-heading">
                                        <h3 className="party-card-name" title={record.name}>
                                            {record.name}
                                        </h3>
                                        <span className="party-card-state">
                                            {record.state || "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="party-card-info-list">
                                    <div className="party-card-info-row">
                                        <span className="party-card-info-label">
                                            <MapPin size={14} style={{ color: "#059669" }} />
                                            <span>मंडी</span>
                                        </span>
                                        <span className="party-card-info-val">{record.mandi}</span>
                                    </div>

                                    <div className="party-card-info-row">
                                        <span className="party-card-info-label">
                                            <Route size={14} style={{ color: "#0284c7" }} />
                                            <span>दूरी</span>
                                        </span>
                                        <span className="party-card-info-val">{record.distance} कि.मी.</span>
                                    </div>

                                    <div className="party-card-info-row">
                                        <span className="party-card-info-label">
                                            <FileBadge size={14} style={{ color: "#64748b" }} />
                                            <span>लाइसेंस</span>
                                        </span>
                                        <span className="party-card-info-val">
                                            {record.licenceNumber || "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="party-card-footer">
                                    <button
                                        type="button"
                                        className="btn-card-action edit"
                                        onClick={() => handleEditParty(record)}
                                    >
                                        <Pencil size={14} />
                                        <span>संशोधित करें</span>
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-card-action delete"
                                        onClick={() => setPartyToDelete(record)}
                                    >
                                        <Trash2 size={14} />
                                        <span>हटाएं</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="parties-table-card" style={{ marginTop: "1rem" }}>
                        <footer className="parties-pagination">
                            <span className="parties-pagination-info">
                                पेज {currentPage} / {totalPages} (कुल {filteredRecords.length} में से {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)})
                            </span>
                            <div className="parties-pagination-controls">
                                <button
                                    type="button"
                                    className="btn-pagination"
                                    disabled={currentPage <= 1}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                >
                                    <ChevronLeft size={16} />
                                    <span>पिछला</span>
                                </button>
                                <button
                                    type="button"
                                    className="btn-pagination"
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    <span>अगला</span>
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </footer>
                    </div>
                </>
            )}

            {/* Edit Party Modal */}
            <Modal
                size="tiny"
                dimmer="blurring"
                centered={true}
                mountNode={document.querySelector("#root > div > div.content-container")}
                closeOnDimmerClick={false}
                open={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
            >
                <ModalHeader className="form-header">पार्टी संशोधित करें</ModalHeader>
                <ModalContent>
                    {recordToEdit && (
                        <EditPartyForm party={recordToEdit} callbackFunction={handlePostSuccess} />
                    )}
                </ModalContent>
                <ModalActions className="editparty-modal-actions">
                    <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => setIsEditModalOpen(false)}
                    >
                        <X size={15} />
                        <span>रद्द करें</span>
                    </button>
                    <button
                        type="button"
                        className="btn-modal-submit"
                        onClick={() => document.getElementById("submit-btn")?.click()}
                    >
                        <Check size={15} />
                        <span>संशोधित करें</span>
                    </button>
                </ModalActions>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                size="mini"
                dimmer="blurring"
                centered={true}
                mountNode={document.querySelector("#root > div > div.content-container")}
                closeOnDimmerClick={false}
                open={Boolean(partyToDelete)}
                onClose={() => setPartyToDelete(null)}
            >
                <ModalHeader className="form-header">
                    <span style={{ color: "#e11d48", display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                        <AlertTriangle size={18} />
                        <span>पार्टी हटाएं</span>
                    </span>
                </ModalHeader>
                <ModalContent>
                    {partyToDelete && (
                        <div className="delete-confirm-body">
                            <p style={{ margin: 0, fontSize: "0.94rem", color: "#334155" }}>
                                क्या आप वाकई फर्म <strong>‘{partyToDelete.name}’</strong> (मंडी: {partyToDelete.mandi}) को हटाना चाहते हैं?
                            </p>
                        </div>
                    )}
                </ModalContent>
                <ModalActions className="editparty-modal-actions">
                    <button
                        type="button"
                        className="btn-modal-cancel"
                        onClick={() => setPartyToDelete(null)}
                        disabled={isDeleting}
                    >
                        <X size={15} />
                        <span>रद्द करें</span>
                    </button>
                    <button
                        type="button"
                        className="btn-modal-delete"
                        onClick={handleDeleteParty}
                        disabled={isDeleting}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 size={15} className="spin" />
                                <span>हटाया जा रहा है...</span>
                            </>
                        ) : (
                            <>
                                <Trash2 size={15} />
                                <span>हटाएं</span>
                            </>
                        )}
                    </button>
                </ModalActions>
            </Modal>
        </div>
    );
};

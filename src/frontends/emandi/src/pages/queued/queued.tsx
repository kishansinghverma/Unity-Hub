import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Inbox,
    LayoutGrid,
    List,
    Loader2,
    Plus,
    RotateCcw,
    Search,
    Trash2
} from "lucide-react";
import { toast } from "react-toastify";
import { QueuedEntry, Record as WithIdRecord } from "../../common/types";
import { DeleteParams, Url, pages, vehicleType } from "../../common/constants";
import { formatDisplayDate, getPageWindow, handleError, handleJsonResponse } from "../../operations/utils";
import "./queued.css";

const formatVehicleNumber = (plate: string): string => {
    if (!plate) return "";
    const clean = plate.trim().toUpperCase();
    const compact = clean.replace(/\s+/g, "");
    const match = compact.match(/^([A-Z]{2})(\d{1,2})([A-Z]{1,3})(\d{1,4})$/);
    if (match) {
        return `${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
    }
    return clean;
};

const vehicleTypeHindi: Record<string, string> = {
    "1": "ट्रक",
    "2": "पिकअप",
    "4": "डीसीएम",
    "Truck": "ट्रक",
    "Pickup": "पिकअप",
    "DCM": "डीसीएम"
};

const getVehicleLabel = (type: string | number): string => {
    const key = String(type ?? "");
    return vehicleTypeHindi[key] || vehicleType[key] || key || "वाहन";
};

const formatPartyDetails = (party?: QueuedEntry["party"]): string => {
    if (!party) return "";
    return [party.name, party.mandi, party.state].filter(Boolean).join(", ");
};

export const QueuedPage: React.FC = () => {
    const [records, setRecords] = useState<Array<WithIdRecord<QueuedEntry>>>([]);
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [actionId, setActionId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const pageSize = viewMode === "grid" ? 6 : 10;

    const fetchRecords = () => {
        setIsFetching(true);
        fetch(Url.Queued)
            .then((response) => handleJsonResponse<Array<WithIdRecord<QueuedEntry>>>(response))
            .then((data) => {
                setRecords(data ?? []);
            })
            .catch(handleError)
            .finally(() => setIsFetching(false));
    };

    const processRecord = (record: WithIdRecord<QueuedEntry>) => {
        setActionId(record._id);
        fetch(`${Url.Dispatches}/pop/${record._id}`)
            .then((response) => handleJsonResponse<WithIdRecord<QueuedEntry>>(response))
            .then((popped) => {
                toast.success("गेटपास सफलतापूर्वक प्रोसेस किया गया।");
                const targetId = popped?._id ?? record._id;
                setRecords((prev) => prev.filter((r) => r._id !== targetId));
            })
            .catch(handleError)
            .finally(() => setActionId(null));
    };

    const deleteRecord = (id: string) => {
        setActionId(id);
        fetch(`${Url.Dispatches}/${id}`, DeleteParams)
            .then((response) => handleJsonResponse<WithIdRecord<QueuedEntry>>(response))
            .then(() => {
                toast.success("गेटपास अनुरोध हटा दिया गया।");
                setRecords((prev) => prev.filter((r) => r._id !== id));
            })
            .catch(handleError)
            .finally(() => setActionId(null));
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    const filteredRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return records;
        const compactQuery = query.replace(/\s+/g, "");

        return records.filter((r) => {
            const vehicle = (r.vehicleNumber || "").toLowerCase().replace(/\s+/g, "");
            const party = (r.party?.name || "").toLowerCase();
            const mandi = (r.party?.mandi || "").toLowerCase();
            const state = (r.party?.state || "").toLowerCase();

            return (
                vehicle.includes(compactQuery) ||
                party.includes(query) ||
                mandi.includes(query) ||
                state.includes(query)
            );
        });
    }, [records, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));

    const paginatedRecords = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredRecords.slice(start, start + pageSize);
    }, [filteredRecords, currentPage, pageSize]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, viewMode]);

    return (
        <div className="queued-page-wrapper">
            {/* Header Card */}
            <div className="queued-header-card">
                <div className="queued-header-top-row">
                    <div className="header-title-group">
                        <h1>जारी होने वाले गेटपास</h1>
                        <p>गेटपास के लिए प्रतीक्षारत वाहनों की सूची</p>
                    </div>

                    {/* New Gatepass CTA */}
                    <Link to={pages.newEntry.route} className="btn-header-primary">
                        <Plus size={18} />
                        <span>गेटपास</span>
                    </Link>
                </div>

                <div className="header-controls">
                    {/* Search Input */}
                    <div className="search-box-wrap">
                        <Search size={18} className="search-box-icon" />
                        <input
                            type="text"
                            className="search-box-input"
                            placeholder="आढ़तिया या गाड़ी नंबर खोजें..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Actions Group (View Toggle + Refresh) */}
                    <div className="header-actions-group">
                        <div className="view-mode-toggle" role="group" aria-label="View Mode">
                            <button
                                type="button"
                                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="ग्रिड व्यू (Grid View)"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                type="button"
                                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewMode("list")}
                                title="लिस्ट व्यू (List View)"
                            >
                                <List size={18} />
                            </button>
                        </div>

                        {/* Refresh Button */}
                        <button
                            type="button"
                            className="btn-header-action"
                            onClick={fetchRecords}
                            disabled={isFetching}
                            title="रिफ्रेश करें"
                        >
                            <RotateCcw size={18} className={isFetching ? "spin" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {filteredRecords.length === 0 ? (
                <div className="queued-empty-card">
                    <div className="empty-icon-circle">
                        {isFetching ? <Loader2 size={30} className="spin" /> : <Inbox size={30} />}
                    </div>
                    <h2 className="empty-title">
                        {isFetching
                            ? "गेटपास लोड हो रहे हैं..."
                            : searchQuery
                            ? "कोई परिणाम नहीं मिला"
                            : "कोई नया गेटपास जारी होने के लिए नहीं है"}
                    </h2>
                    <p className="empty-subtitle">
                        {isFetching
                            ? "कृपया कुछ क्षण प्रतीक्षा करें।"
                            : searchQuery
                            ? `"${searchQuery}" के लिए कोई गेटपास रिकॉर्ड नहीं मिला।`
                            : "सभी गेटपास प्रोसेस हो चुके हैं या नया गेटपास अनुरोध दर्ज करें।"}
                    </p>
                </div>
            ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="queued-grid">
                    {paginatedRecords.map((record) => {
                        const isProcessing = actionId === record._id;

                        return (
                            <div className="gatepass-card" key={record._id}>
                                <div className="card-header-row">
                                    <span className="card-date-badge">
                                        {formatDisplayDate(record.date)}
                                    </span>
                                    <span className="card-plate-badge">
                                        {formatVehicleNumber(record.vehicleNumber)}
                                    </span>
                                </div>

                                <div className="card-entity-details">
                                    <h2 className="card-party-name">
                                        {formatPartyDetails(record.party)}
                                    </h2>
                                    <p className="card-seller-name">{record.seller}</p>
                                </div>

                                <div className="card-metrics-box">
                                    <div className="metric-item">
                                        <span className="metric-label">वजन</span>
                                        <span className="metric-value">{record.weight} क्विंटल</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">पैकेट</span>
                                        <span className="metric-value">{record.bags} बोरी</span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">वाहन</span>
                                        <span className="metric-value">
                                            {getVehicleLabel(record.vehicleType)}
                                        </span>
                                    </div>
                                    <div className="metric-item">
                                        <span className="metric-label">दूरी</span>
                                        <span className="metric-value">
                                            {record.party?.distance ? `${record.party.distance} किमी` : "—"}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-footer-row">
                                    <button
                                        type="button"
                                        className="btn-card-delete"
                                        onClick={() => deleteRecord(record._id)}
                                        disabled={isProcessing}
                                        title="गेटपास हटाएं"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-card-process"
                                        onClick={() => processRecord(record)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <Loader2 size={16} className="spin" />
                                        ) : (
                                            <Check size={16} />
                                        )}
                                        <span>Mark Processed</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View */
                <div className="queued-table-card">
                    <div className="table-scroll-wrap">
                        <table className="modern-queued-table">
                            <thead>
                                <tr>
                                    <th>दिनांक</th>
                                    <th>आढ़तिया फर्म</th>
                                    <th>गाड़ी नंबर</th>
                                    <th>वाहन</th>
                                    <th>विक्रेता (किसान)</th>
                                    <th>पैकेट</th>
                                    <th>वजन</th>
                                    <th className="center">कार्रवाई</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((record) => {
                                    const isProcessing = actionId === record._id;

                                    return (
                                        <tr key={record._id}>
                                            <td>{formatDisplayDate(record.date)}</td>
                                            <td>{formatPartyDetails(record.party)}</td>
                                            <td>{formatVehicleNumber(record.vehicleNumber)}</td>
                                            <td>{getVehicleLabel(record.vehicleType)}</td>
                                            <td>{record.seller}</td>
                                            <td>{record.bags}</td>
                                            <td>{record.weight}</td>
                                            <td>
                                                <div className="table-actions-cell">
                                                    <button
                                                        type="button"
                                                        className="btn-table-process"
                                                        onClick={() => processRecord(record)}
                                                        disabled={isProcessing}
                                                        title="Mark Processed"
                                                    >
                                                        {isProcessing ? (
                                                            <Loader2 size={14} className="spin" />
                                                        ) : (
                                                            <Check size={14} />
                                                        )}
                                                    </button>

                                                    <button
                                                        type="button"
                                                        className="btn-table-delete"
                                                        onClick={() => deleteRecord(record._id)}
                                                        disabled={isProcessing}
                                                        title="गेटपास हटाएं"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Pagination */}
            {filteredRecords.length > 0 && totalPages > 1 && (
                <div className="queued-pagination-wrap">
                    <div className="pagination-stats">
                        कुल {filteredRecords.length} गेटपास • पृष्ठ {currentPage} / {totalPages}
                    </div>

                    <div className="pagination-controls">
                        <button
                            type="button"
                            className="pagination-btn"
                            disabled={currentPage <= 1}
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            title="पिछला पृष्ठ"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {getPageWindow(currentPage, totalPages).map((pageNumber) => (
                            <button
                                key={pageNumber}
                                type="button"
                                className={`pagination-btn ${pageNumber === currentPage ? "active" : ""}`}
                                onClick={() => setCurrentPage(pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        ))}

                        <button
                            type="button"
                            className="pagination-btn"
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            title="अगला पृष्ठ"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

import React, { useEffect, useMemo, useState } from "react";
import {
    Check,
    ChevronLeft,
    ChevronRight,
    Inbox,
    LayoutGrid,
    List,
    Loader2,
    RotateCcw,
    Search,
    Undo2
} from "lucide-react";
import { toast } from "react-toastify";
import { ProcessedEntry, Record as WithIdRecord } from "../../common/types";
import { Url, vehicleType } from "../../common/constants";
import { formatDisplayDate, handleError, handleJsonResponse } from "../../operations/utils";
import "./processed.css";

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

const formatPartyDetails = (party?: ProcessedEntry["party"]): string => {
    if (!party) return "";
    return [party.name, party.mandi, party.state].filter(Boolean).join(", ");
};

const formatRate = (rate: any): string => {
    if (!rate && rate !== 0) return "—";
    const numeric = typeof rate === "number" ? rate : parseFloat(rate);
    if (!Number.isFinite(numeric)) return "—";
    return `₹${Math.ceil(numeric).toLocaleString("en-IN")}`;
};

const calculateAmount = (rate: any, weight: any): string => {
    if (!rate && rate !== 0) return "—";
    const numericRate = typeof rate === "number" ? rate : parseFloat(rate);
    const numericWeight = typeof weight === "number" ? weight : parseFloat(weight);
    if (!Number.isFinite(numericRate) || !Number.isFinite(numericWeight)) return "—";
    const amount = Math.ceil((numericRate * numericWeight * 1.5) / 100);
    return `₹${amount.toLocaleString("en-IN")}`;
};

export const ProcessedPage: React.FC = () => {
    const [records, setRecords] = useState<Array<WithIdRecord<ProcessedEntry>>>([]);
    const [isFetching, setIsFetching] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");
    const [actionId, setActionId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const pageSize = viewMode === "grid" ? 6 : 10;
    const todayIsoDate = new Date().toISOString().slice(0, 10);

    const isEligibleForRequeue = (recordDate: string): boolean => {
        if (!recordDate) return false;
        if (recordDate.slice(0, 10) === todayIsoDate) return true;
        try {
            const parsed = new Date(recordDate);
            return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === todayIsoDate;
        } catch {
            return false;
        }
    };

    const fetchRecords = () => {
        setIsFetching(true);
        fetch(Url.Processed)
            .then((response) => handleJsonResponse<Array<WithIdRecord<ProcessedEntry>>>(response))
            .then((data) => {
                const list = (data ?? []).slice().reverse();
                setRecords(list);
            })
            .catch(handleError)
            .finally(() => setIsFetching(false));
    };

    const requeueRecord = (id: string) => {
        setActionId(id);
        fetch(`${Url.Dispatches}/requeue/${id}`)
            .then((response) => handleJsonResponse<WithIdRecord<ProcessedEntry>>(response))
            .then(() => {
                toast.success("गेटपास को कतार (Queue) में वापस भेज दिया गया।");
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
            const seller = (r.seller || "").toLowerCase();

            return (
                vehicle.includes(compactQuery) ||
                party.includes(query) ||
                mandi.includes(query) ||
                state.includes(query) ||
                seller.includes(query)
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
        <div className="processed-page-wrapper">
            {/* Header Card */}
            <div className="processed-header-card">
                <div className="header-title-group">
                    <h1>जारी हो चुके गेटपास</h1>
                    <p>सफलतापूर्वक जारी किए गए गेटपास की सूची</p>
                </div>

                <div className="header-controls">
                    {/* Search */}
                    <div className="search-box-wrap">
                        <span className="search-box-icon">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            className="search-box-input"
                            placeholder="आढ़तिया, गाड़ी नंबर या किसान खोजें..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Actions Group (View Switcher + Refresh) */}
                    <div className="header-actions-group">
                        <div className="view-mode-toggle" role="group" aria-label="दृश्य मोड चुनें">
                            <button
                                type="button"
                                className={`view-toggle-btn ${viewMode === "list" ? "active" : ""}`}
                                onClick={() => setViewMode("list")}
                                title="तालिका दृश्य (List View)"
                                aria-pressed={viewMode === "list"}
                            >
                                <List size={18} />
                            </button>
                            <button
                                type="button"
                                className={`view-toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                                onClick={() => setViewMode("grid")}
                                title="कार्ड दृश्य (Grid View)"
                                aria-pressed={viewMode === "grid"}
                            >
                                <LayoutGrid size={18} />
                            </button>
                        </div>

                        {/* Refresh */}
                        <button
                            type="button"
                            className="btn-header-action"
                            onClick={fetchRecords}
                            disabled={isFetching}
                            title="ताज़ा करें (Refresh)"
                        >
                            <RotateCcw size={18} className={isFetching ? "spin" : ""} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {filteredRecords.length === 0 ? (
                <div className="processed-empty-card">
                    <div className="empty-icon-circle">
                        <Inbox size={32} />
                    </div>
                    <h3 className="empty-title">कोई रिकॉर्ड नहीं मिला</h3>
                    <p className="empty-subtitle">
                        {searchQuery
                            ? "आपकी खोज के अनुसार कोई रिकॉर्ड उपलब्ध नहीं है।"
                            : "अभी तक कोई गेटपास जारी नहीं किया गया है।"}
                    </p>
                </div>
            ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="processed-grid">
                    {paginatedRecords.map((record) => {
                        const isRequeuing = actionId === record._id;
                        const canRequeue = Boolean(record._id && isEligibleForRequeue(record.date));

                        return (
                            <div key={record._id} className="processed-card">
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
                                    <p className="card-seller-name">
                                        {record.seller}
                                    </p>
                                    <div className="card-sub-row">
                                        <span className="card-vehicle-type">
                                            {getVehicleLabel(record.vehicleType)}
                                        </span>
                                        <span className="card-payment-badge">
                                            {record.paymentMode ?? "Postpaid"}
                                        </span>
                                    </div>
                                </div>

                                <div className="card-metrics-box">
                                    <div className="metric-item">
                                        <span className="metric-label">वजन</span>
                                        <span className="metric-value">{record.weight}</span>
                                    </div>

                                    <div className="metric-item">
                                        <span className="metric-label">पैकेट</span>
                                        <span className="metric-value">{record.bags}</span>
                                    </div>

                                    <div className="metric-item">
                                        <span className="metric-label">दर</span>
                                        <span className="metric-value">{formatRate(record.rate)}</span>
                                    </div>

                                    <div className="metric-item">
                                        <span className="metric-label">शुल्क</span>
                                        <span className="metric-value">{calculateAmount(record.rate, record.weight)}</span>
                                    </div>
                                </div>

                                <div className="card-footer-row">
                                    {canRequeue && (
                                        <button
                                            type="button"
                                            className="btn-card-requeue"
                                            onClick={() => requeueRecord(record._id)}
                                            disabled={isRequeuing}
                                            title="कतार में वापस भेजें (Re-Queue)"
                                        >
                                            {isRequeuing ? (
                                                <Loader2 size={16} className="spin" />
                                            ) : (
                                                <Undo2 size={16} />
                                            )}
                                            <span>Re-Queue</span>
                                        </button>
                                    )}

                                    <span className="badge-processed">
                                        <Check size={16} />
                                        <span>जारी</span>
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                /* List View (Default) */
                <div className="processed-table-card">
                    <div className="table-scroll-wrap">
                        <table className="modern-processed-table">
                            <thead>
                                <tr>
                                    <th>दिनांक</th>
                                    <th>आढ़तिया फर्म</th>
                                    <th>गाड़ी नंबर</th>
                                    <th>वाहन</th>
                                    <th>विक्रेता (किसान)</th>
                                    <th>पैकेट</th>
                                    <th>वजन</th>
                                    <th>दर</th>
                                    <th>शुल्क</th>
                                    <th>भुगतान</th>
                                    <th className="center">कार्रवाई</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedRecords.map((record) => {
                                    const isRequeuing = actionId === record._id;
                                    const canRequeue = Boolean(record._id && isEligibleForRequeue(record.date));

                                    return (
                                        <tr key={record._id}>
                                            <td>{formatDisplayDate(record.date)}</td>
                                            <td>{formatPartyDetails(record.party)}</td>
                                            <td>{formatVehicleNumber(record.vehicleNumber)}</td>
                                            <td>{getVehicleLabel(record.vehicleType)}</td>
                                            <td>{record.seller}</td>
                                            <td>{record.bags}</td>
                                            <td>{record.weight}</td>
                                            <td>{formatRate(record.rate)}</td>
                                            <td>{calculateAmount(record.rate, record.weight)}</td>
                                            <td>{record.paymentMode ?? "Postpaid"}</td>
                                            <td>
                                                <div className="table-actions-cell">
                                                    {canRequeue ? (
                                                        <button
                                                            type="button"
                                                            className="btn-table-requeue"
                                                            onClick={() => requeueRecord(record._id)}
                                                            disabled={isRequeuing}
                                                            title="कतार में वापस भेजें (Re-Queue)"
                                                        >
                                                            {isRequeuing ? (
                                                                <Loader2 size={14} className="spin" />
                                                            ) : (
                                                                <Undo2 size={14} />
                                                            )}
                                                        </button>
                                                    ) : (
                                                        <span>—</span>
                                                    )}
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
                <div className="processed-pagination-wrap">
                    <div className="pagination-stats">
                        कुल {filteredRecords.length} रिकॉर्ड • पृष्ठ {currentPage} / {totalPages}
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

                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
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

import React, { ChangeEvent, FormEvent, SyntheticEvent, useState } from "react";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    Building2,
    FileCheck2,
    Globe,
    ListFilter,
    Loader2,
    MapPin,
    PlusCircle,
    RotateCcw,
    Route
} from "lucide-react";
import { Dropdown, DropdownProps } from "semantic-ui-react";
import { toast } from "react-toastify";
import { pages, States } from "../../common/constants";
import { SelectOption } from "../../common/types";
import { createNewParty, getDistance } from "../../operations/fetch";
import { handleError, handleResponse } from "../../operations/utils";
import "./newparty.css";

type FormFields = {
    name: string;
    mandi: string;
    stateCode: string;
    distance: string;
    licenceNumber: string;
    isLicenceNotRequired: boolean;
};

type FieldName = keyof FormFields;
type FieldErrors = Partial<Record<FieldName, string>>;
type TouchedFields = Partial<Record<FieldName, boolean>>;

const initialFormValues: FormFields = {
    name: "",
    mandi: "",
    stateCode: "",
    distance: "",
    licenceNumber: "",
    isLicenceNotRequired: false
};

const stateOptions: Array<SelectOption> = Object.keys(States).map((key) => ({
    key: `state-${key}`,
    value: key,
    text: States[key]
}));

export const NewParty: React.FC = () => {
    const [values, setValues] = useState<FormFields>(initialFormValues);
    const [touched, setTouched] = useState<TouchedFields>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isDistanceLoading, setIsDistanceLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dropdownResetKey, setDropdownResetKey] = useState(0);

    const isLicenceRequired = !values.isLicenceNotRequired;

    const validateSingleField = (name: FieldName, currentValues: FormFields): string | undefined => {
        const val = currentValues[name];

        switch (name) {
            case "name": {
                const trimmed = (val as string).trim();
                if (!trimmed) return "आढ़तिया फर्म का नाम आवश्यक है।";
                if (trimmed.length < 3) return "फर्म का नाम कम से कम 3 अक्षरों का होना चाहिए।";
                return undefined;
            }

            case "mandi": {
                const trimmed = (val as string).trim();
                if (!trimmed) return "मंडी का नाम आवश्यक है।";
                if (trimmed.length < 2) return "मंडी का नाम कम से कम 2 अक्षरों का होना चाहिए।";
                return undefined;
            }

            case "stateCode": {
                const trimmed = (val as string).trim();
                if (!trimmed) return "राज्य का चयन करना आवश्यक है।";
                return undefined;
            }

            case "distance": {
                const trimmed = (val as string).trim();
                if (!trimmed) return "दूरी (K.M.) दर्ज करना आवश्यक है।";
                const num = Number(trimmed);
                if (!Number.isFinite(num) || num <= 0) return "कृपया मान्य दूरी (0 से अधिक) दर्ज करें।";
                return undefined;
            }

            case "licenceNumber": {
                const requiresLicence = !currentValues.isLicenceNotRequired;
                const trimmed = (val as string).trim();
                if (requiresLicence && !trimmed) {
                    return "लाइसेंस संख्या आवश्यक है।";
                }
                return undefined;
            }

            default:
                return undefined;
        }
    };

    const validateAll = (currentValues: FormFields): FieldErrors => {
        const errs: FieldErrors = {};
        const fields: FieldName[] = ["name", "mandi", "stateCode", "distance", "licenceNumber"];
        fields.forEach((field) => {
            const err = validateSingleField(field, currentValues);
            if (err) errs[field] = err;
        });
        return errs;
    };

    const updateField = (name: FieldName, rawValue: string | boolean) => {
        const nextValue = name === "licenceNumber" && typeof rawValue === "string"
            ? rawValue.toUpperCase()
            : rawValue;

        const nextValues: FormFields = { ...values, [name]: nextValue };
        setValues(nextValues);

        if (touched[name]) {
            const err = validateSingleField(name, nextValues);
            setErrors((prev) => ({ ...prev, [name]: err }));
        }

        if (name === "isLicenceNotRequired") {
            const licenceErr = validateSingleField("licenceNumber", nextValues);
            setErrors((prev) => ({ ...prev, licenceNumber: licenceErr }));
        }
    };

    const handleBlur = (name: FieldName) => {
        if (typeof values[name] === "string") {
            const trimmed = (values[name] as string).trim();
            const nextValues = { ...values, [name]: trimmed };
            setValues(nextValues);
            setTouched((prev) => ({ ...prev, [name]: true }));
            const err = validateSingleField(name, nextValues);
            setErrors((prev) => ({ ...prev, [name]: err }));
        } else {
            setTouched((prev) => ({ ...prev, [name]: true }));
        }
    };

    const handleMandiBlur = () => {
        const trimmedMandi = values.mandi.trim();
        const nextValues = { ...values, mandi: trimmedMandi };
        setValues(nextValues);
        setTouched((prev) => ({ ...prev, mandi: true }));
        const err = validateSingleField("mandi", nextValues);
        setErrors((prev) => ({ ...prev, mandi: err }));

        if (trimmedMandi) {
            setIsDistanceLoading(true);
            getDistance(trimmedMandi)
                .then((distance) => {
                    if (distance !== undefined && distance !== null) {
                        const calculatedDistance = distance.toString();
                        setValues((prev) => {
                            const updated = { ...prev, distance: calculatedDistance };
                            setErrors((prevErrors) => ({
                                ...prevErrors,
                                distance: validateSingleField("distance", updated)
                            }));
                            return updated;
                        });
                        setTouched((prev) => ({ ...prev, distance: true }));
                    }
                })
                .catch(handleError)
                .finally(() => setIsDistanceLoading(false));
        }
    };

    const handleReset = () => {
        setValues(initialFormValues);
        setTouched({});
        setErrors({});
        setDropdownResetKey((prev) => prev + 1);
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();

        const fieldErrors = validateAll(values);
        setErrors(fieldErrors);
        setTouched({
            name: true,
            mandi: true,
            stateCode: true,
            distance: true,
            licenceNumber: true
        });

        if (Object.keys(fieldErrors).length > 0) {
            toast.error("कृपया सभी आवश्यक जानकारी भरें।");
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                name: values.name.trim(),
                mandi: values.mandi.trim(),
                stateCode: values.stateCode,
                distance: values.distance.trim(),
                licenceNumber: values.isLicenceNotRequired
                    ? undefined
                    : values.licenceNumber.trim().toUpperCase() || undefined
            };

            const response = await createNewParty(payload);
            await handleResponse(response);
            toast.success("नई पार्टी सफलतापूर्वक दर्ज हो गई।");
            handleReset();
        } catch (error) {
            handleError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="newparty-page-wrapper">
            <div className="newparty-card">
                <div className="newparty-header">
                    <div className="newparty-header-main">
                        <div className="newparty-brand-icon">
                            <Building2 size={26} strokeWidth={2.2} />
                        </div>
                        <div className="newparty-title-group">
                            <h1>नई पार्टी जोड़ें</h1>
                            <p>आढ़तिया फर्म एवं मंडी विवरण दर्ज करें</p>
                        </div>
                    </div>
                    <Link to={pages.parties.route} className="btn-header-link">
                        <ListFilter size={15} />
                        <span>पार्टी सूची</span>
                    </Link>
                </div>

                <form className="newparty-form" onSubmit={handleSubmit} noValidate autoComplete="off">
                    <section className="newparty-section">
                        <div className="newparty-section-header">
                            <h2 className="newparty-section-title">
                                <Building2 size={16} />
                                <span>फर्म विवरण</span>
                            </h2>
                        </div>
                        <div className="newparty-grid-2">
                            <div className={`newparty-field full-width ${touched.name && errors.name ? "has-error" : ""}`}>
                                <div className="newparty-label-row">
                                    <label htmlFor="party-name" className="newparty-label">
                                        <span>आढ़तिया फर्म का नाम</span>
                                        <span className="newparty-required">*</span>
                                    </label>
                                </div>
                                <div className="newparty-input-wrap">
                                    <span className="newparty-input-icon">
                                        <Building2 size={18} />
                                    </span>
                                    <input
                                        id="party-name"
                                        name="name"
                                        type="text"
                                        className="newparty-input"
                                        placeholder="फर्म का पूरा नाम दर्ज करें"
                                        value={values.name}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("name", e.target.value)}
                                        onBlur={() => handleBlur("name")}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {touched.name && errors.name && (
                                    <p className="newparty-error-msg">
                                        <AlertCircle size={13} />
                                        <span>{errors.name}</span>
                                    </p>
                                )}
                            </div>

                            <div className={`newparty-field full-width ${touched.mandi && errors.mandi ? "has-error" : ""}`}>
                                <div className="newparty-label-row">
                                    <label htmlFor="party-mandi" className="newparty-label">
                                        <span>मंडी का नाम</span>
                                        <span className="newparty-required">*</span>
                                    </label>
                                    <span className="newparty-field-hint">दूरी अपने आप लोड होगी</span>
                                </div>
                                <div className="newparty-input-wrap">
                                    <span className="newparty-input-icon">
                                        <MapPin size={18} />
                                    </span>
                                    <input
                                        id="party-mandi"
                                        name="mandi"
                                        type="text"
                                        className="newparty-input"
                                        placeholder="मंडी का नाम दर्ज करें"
                                        value={values.mandi}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("mandi", e.target.value)}
                                        onBlur={handleMandiBlur}
                                        disabled={isSubmitting}
                                    />
                                </div>
                                {touched.mandi && errors.mandi && (
                                    <p className="newparty-error-msg">
                                        <AlertCircle size={13} />
                                        <span>{errors.mandi}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="newparty-section">
                        <div className="newparty-section-header">
                            <h2 className="newparty-section-title">
                                <Route size={16} />
                                <span>स्थान एवं दूरी</span>
                            </h2>
                        </div>
                        <div className="newparty-grid-2">
                            <div className={`newparty-field ${touched.stateCode && errors.stateCode ? "has-error" : ""}`}>
                                <div className="newparty-label-row">
                                    <label htmlFor="party-state" className="newparty-label">
                                        <span>राज्य</span>
                                        <span className="newparty-required">*</span>
                                    </label>
                                </div>
                                <div className="newparty-select-wrap">
                                    <span className="newparty-input-icon">
                                        <Globe size={18} />
                                    </span>
                                    <Dropdown
                                        key={`state-dropdown-${dropdownResetKey}`}
                                        id="party-state"
                                        placeholder="राज्य चुनें"
                                        fluid
                                        search
                                        selection
                                        clearable
                                        options={stateOptions}
                                        value={values.stateCode}
                                        disabled={isSubmitting}
                                        onChange={(_: SyntheticEvent, data: DropdownProps) => {
                                            updateField("stateCode", (data.value as string) || "");
                                            setTouched((prev) => ({ ...prev, stateCode: true }));
                                        }}
                                        onBlur={() => handleBlur("stateCode")}
                                    />
                                </div>
                                {touched.stateCode && errors.stateCode && (
                                    <p className="newparty-error-msg">
                                        <AlertCircle size={13} />
                                        <span>{errors.stateCode}</span>
                                    </p>
                                )}
                            </div>

                            <div className={`newparty-field ${touched.distance && errors.distance ? "has-error" : ""}`}>
                                <div className="newparty-label-row">
                                    <label htmlFor="party-distance" className="newparty-label">
                                        <span>दूरी</span>
                                        <span className="newparty-required">*</span>
                                    </label>
                                    {isDistanceLoading && (
                                        <span className="newparty-field-hint" style={{ color: "#059669" }}>
                                            दूरी गणना हो रही है...
                                        </span>
                                    )}
                                </div>
                                <div className="newparty-input-wrap">
                                    <span className="newparty-input-icon">
                                        {isDistanceLoading ? <Loader2 size={18} className="spin" /> : <Route size={18} />}
                                    </span>
                                    <input
                                        id="party-distance"
                                        name="distance"
                                        type="number"
                                        min="1"
                                        step="1"
                                        className="newparty-input with-suffix"
                                        placeholder="दूरी दर्ज करें"
                                        value={values.distance}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("distance", e.target.value)}
                                        onBlur={() => handleBlur("distance")}
                                        disabled={isSubmitting}
                                    />
                                    <span className="newparty-unit-badge">कि.मी.</span>
                                </div>
                                {touched.distance && errors.distance && (
                                    <p className="newparty-error-msg">
                                        <AlertCircle size={13} />
                                        <span>{errors.distance}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    <section className="newparty-section">
                        <div className="newparty-section-header">
                            <h2 className="newparty-section-title">
                                <FileCheck2 size={16} />
                                <span>लाइसेंस विवरण</span>
                            </h2>
                        </div>
                        <div className="newparty-grid-2">
                            <div className={`newparty-field full-width ${touched.licenceNumber && errors.licenceNumber ? "has-error" : ""}`}>
                                <div className="newparty-label-row">
                                    <label htmlFor="party-licence" className="newparty-label">
                                        <span>लाइसेंस संख्या</span>
                                        {isLicenceRequired && <span className="newparty-required">*</span>}
                                    </label>
                                    <span className="newparty-field-hint">
                                        {isLicenceRequired ? "अनिवार्य" : "वैकल्पिक"}
                                    </span>
                                </div>
                                <div className="newparty-input-wrap">
                                    <span className="newparty-input-icon">
                                        <FileCheck2 size={18} />
                                    </span>
                                    <input
                                        id="party-licence"
                                        name="licenceNumber"
                                        type="text"
                                        className="newparty-input uppercase"
                                        placeholder="लाइसेंस नंबर दर्ज करें"
                                        value={values.licenceNumber}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("licenceNumber", e.target.value)}
                                        onBlur={() => handleBlur("licenceNumber")}
                                        disabled={isSubmitting || values.isLicenceNotRequired}
                                    />
                                </div>
                                {touched.licenceNumber && errors.licenceNumber && (
                                    <p className="newparty-error-msg">
                                        <AlertCircle size={13} />
                                        <span>{errors.licenceNumber}</span>
                                    </p>
                                )}
                            </div>

                            <div className="newparty-field full-width">
                                <label
                                    htmlFor="licence-required-toggle"
                                    className={`newparty-checkbox-card ${values.isLicenceNotRequired ? "checked" : ""}`}
                                >
                                    <input
                                        id="licence-required-toggle"
                                        type="checkbox"
                                        className="newparty-checkbox-input"
                                        checked={values.isLicenceNotRequired}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("isLicenceNotRequired", e.target.checked)}
                                        disabled={isSubmitting}
                                    />
                                    <div className="newparty-checkbox-label">
                                        <span>लाइसेंस नंबर की आवश्यकता नहीं है</span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </section>

                    <div className="newparty-actions">
                        <button
                            type="button"
                            className="btn-newparty-reset"
                            onClick={handleReset}
                            disabled={isSubmitting}
                        >
                            <RotateCcw size={16} />
                            <span>रीसेट करें</span>
                        </button>
                        <button
                            type="submit"
                            className="btn-newparty-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="spin" />
                                    <span>सहेजा जा रहा है...</span>
                                </>
                            ) : (
                                <>
                                    <PlusCircle size={18} />
                                    <span>पार्टी जोड़ें</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

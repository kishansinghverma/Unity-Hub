import React, { ChangeEvent, FormEvent, SyntheticEvent, useEffect, useState } from "react";
import {
    AlertCircle,
    Building2,
    FileCheck2,
    Globe,
    Loader2,
    MapPin,
    Route
} from "lucide-react";
import { Dropdown, DropdownProps } from "semantic-ui-react";
import { toast } from "react-toastify";
import { States } from "../../common/constants";
import { Party, Record as WithIdRecord, SelectOption } from "../../common/types";
import { getDistance, updateParty } from "../../operations/fetch";
import { handleError, handleResponse } from "../../operations/utils";
import "./editparty.css";

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

const stateOptions: Array<SelectOption> = Object.keys(States).map((key) => ({
    key: `state-${key}`,
    value: key,
    text: States[key]
}));

type EditPartyFormProps = {
    party: WithIdRecord<Party>;
    callbackFunction: (record: WithIdRecord<Party>) => void;
};

export const EditPartyForm: React.FC<EditPartyFormProps> = ({ party, callbackFunction }) => {
    const [values, setValues] = useState<FormFields>({
        name: party?.name || "",
        mandi: party?.mandi || "",
        stateCode: party?.stateCode ? party.stateCode.toString() : "",
        distance: party?.distance !== undefined && party?.distance !== null ? party.distance.toString() : "",
        licenceNumber: party?.licenceNumber || "",
        isLicenceNotRequired: !party?.licenceNumber
    });
    const [touched, setTouched] = useState<TouchedFields>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    const [isDistanceLoading, setIsDistanceLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (party) {
            setValues({
                name: party.name || "",
                mandi: party.mandi || "",
                stateCode: party.stateCode ? party.stateCode.toString() : "",
                distance: party.distance !== undefined && party.distance !== null ? party.distance.toString() : "",
                licenceNumber: party.licenceNumber || "",
                isLicenceNotRequired: !party.licenceNumber
            });
            setTouched({});
            setErrors({});
        }
    }, [party]);

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

        if (trimmedMandi && trimmedMandi.toLowerCase() !== party.mandi.toLowerCase()) {
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
                _id: party._id,
                name: values.name.trim(),
                mandi: values.mandi.trim(),
                stateCode: values.stateCode,
                distance: values.distance.trim(),
                licenceNumber: values.isLicenceNotRequired
                    ? undefined
                    : values.licenceNumber.trim().toUpperCase() || undefined
            };

            const { executeRequest, data } = updateParty(payload);
            const response = await executeRequest();
            await handleResponse(response);
            toast.success("पार्टी सफलतापूर्वक संशोधित हो गई।");
            callbackFunction(data as WithIdRecord<Party>);
        } catch (error) {
            handleError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="editparty-form" onSubmit={handleSubmit} noValidate autoComplete="off">
            <div className={`editparty-field full-width ${touched.name && errors.name ? "has-error" : ""}`}>
                <div className="editparty-label-row">
                    <label htmlFor="edit-party-name" className="editparty-label">
                        <span>आढ़तिया फर्म का नाम</span>
                        <span className="editparty-required">*</span>
                    </label>
                </div>
                <div className="editparty-input-wrap">
                    <span className="editparty-input-icon">
                        <Building2 size={16} />
                    </span>
                    <input
                        id="edit-party-name"
                        name="name"
                        type="text"
                        className="editparty-input"
                        placeholder="फर्म का पूरा नाम दर्ज करें"
                        value={values.name}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("name", e.target.value)}
                        onBlur={() => handleBlur("name")}
                        disabled={isSubmitting}
                    />
                </div>
                {touched.name && errors.name && (
                    <p className="editparty-error-msg">
                        <AlertCircle size={13} />
                        <span>{errors.name}</span>
                    </p>
                )}
            </div>

            <div className={`editparty-field full-width ${touched.mandi && errors.mandi ? "has-error" : ""}`}>
                <div className="editparty-label-row">
                    <label htmlFor="edit-party-mandi" className="editparty-label">
                        <span>मंडी का नाम</span>
                        <span className="editparty-required">*</span>
                    </label>
                    <span className="editparty-field-hint">बदलने पर दूरी पुनः लोड होगी</span>
                </div>
                <div className="editparty-input-wrap">
                    <span className="editparty-input-icon">
                        <MapPin size={16} />
                    </span>
                    <input
                        id="edit-party-mandi"
                        name="mandi"
                        type="text"
                        className="editparty-input"
                        placeholder="मंडी का नाम दर्ज करें"
                        value={values.mandi}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("mandi", e.target.value)}
                        onBlur={handleMandiBlur}
                        disabled={isSubmitting}
                    />
                </div>
                {touched.mandi && errors.mandi && (
                    <p className="editparty-error-msg">
                        <AlertCircle size={13} />
                        <span>{errors.mandi}</span>
                    </p>
                )}
            </div>

            <div className="editparty-grid-2">
                <div className={`editparty-field ${touched.stateCode && errors.stateCode ? "has-error" : ""}`}>
                    <div className="editparty-label-row">
                        <label htmlFor="edit-party-state" className="editparty-label">
                            <span>राज्य</span>
                            <span className="editparty-required">*</span>
                        </label>
                    </div>
                    <div className="editparty-select-wrap">
                        <span className="editparty-input-icon">
                            <Globe size={16} />
                        </span>
                        <Dropdown
                            id="edit-party-state"
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
                        <p className="editparty-error-msg">
                            <AlertCircle size={13} />
                            <span>{errors.stateCode}</span>
                        </p>
                    )}
                </div>

                <div className={`editparty-field ${touched.distance && errors.distance ? "has-error" : ""}`}>
                    <div className="editparty-label-row">
                        <label htmlFor="edit-party-distance" className="editparty-label">
                            <span>दूरी</span>
                            <span className="editparty-required">*</span>
                        </label>
                        {isDistanceLoading && (
                            <span className="editparty-field-hint" style={{ color: "#059669" }}>
                                गणना...
                            </span>
                        )}
                    </div>
                    <div className="editparty-input-wrap">
                        <span className="editparty-input-icon">
                            {isDistanceLoading ? <Loader2 size={16} className="spin" /> : <Route size={16} />}
                        </span>
                        <input
                            id="edit-party-distance"
                            name="distance"
                            type="number"
                            min="1"
                            step="1"
                            className="editparty-input with-suffix"
                            placeholder="दूरी"
                            value={values.distance}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("distance", e.target.value)}
                            onBlur={() => handleBlur("distance")}
                            disabled={isSubmitting}
                        />
                        <span className="editparty-unit-badge">कि.मी.</span>
                    </div>
                    {touched.distance && errors.distance && (
                        <p className="editparty-error-msg">
                            <AlertCircle size={13} />
                            <span>{errors.distance}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className={`editparty-field full-width ${touched.licenceNumber && errors.licenceNumber ? "has-error" : ""}`}>
                <div className="editparty-label-row">
                    <label htmlFor="edit-party-licence" className="editparty-label">
                        <span>लाइसेंस संख्या</span>
                        {isLicenceRequired && <span className="editparty-required">*</span>}
                    </label>
                    <span className="editparty-field-hint">
                        {isLicenceRequired ? "अनिवार्य" : "वैकल्पिक"}
                    </span>
                </div>
                <div className="editparty-input-wrap">
                    <span className="editparty-input-icon">
                        <FileCheck2 size={16} />
                    </span>
                    <input
                        id="edit-party-licence"
                        name="licenceNumber"
                        type="text"
                        className="editparty-input uppercase"
                        placeholder="लाइसेंस नंबर दर्ज करें"
                        value={values.licenceNumber}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("licenceNumber", e.target.value)}
                        onBlur={() => handleBlur("licenceNumber")}
                        disabled={isSubmitting || values.isLicenceNotRequired}
                    />
                </div>
                {touched.licenceNumber && errors.licenceNumber && (
                    <p className="editparty-error-msg">
                        <AlertCircle size={13} />
                        <span>{errors.licenceNumber}</span>
                    </p>
                )}
            </div>

            <div className="editparty-field full-width">
                <label
                    htmlFor="edit-licence-required-toggle"
                    className={`editparty-checkbox-card ${values.isLicenceNotRequired ? "checked" : ""}`}
                >
                    <input
                        id="edit-licence-required-toggle"
                        type="checkbox"
                        className="editparty-checkbox-input"
                        checked={values.isLicenceNotRequired}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => updateField("isLicenceNotRequired", e.target.checked)}
                        disabled={isSubmitting}
                    />
                    <div className="editparty-checkbox-label">
                        <span>लाइसेंस नंबर की आवश्यकता नहीं है</span>
                        <span className="editparty-checkbox-desc">
                            यदि पार्टी के पास अभी वैध लाइसेंस नहीं है तो इसे चुनें
                        </span>
                    </div>
                </label>
            </div>

            {/* Hidden submit button triggered by Semantic Modal action button */}
            <button type="submit" id="submit-btn" style={{ display: "none" }} disabled={isSubmitting} />
        </form>
    );
};
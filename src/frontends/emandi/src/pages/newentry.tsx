import React, { ChangeEvent, FormEvent, SyntheticEvent, useEffect, useRef, useState } from "react";
import {
    AlertCircle,
    Building2,
    Camera,
    FileCheck2,
    Hash,
    ImagePlus,
    Loader2,
    Package,
    Pencil,
    RotateCcw,
    Scale,
    Send,
    Trash2,
    Truck,
    User
} from "lucide-react";
import { Dropdown, DropdownProps } from "semantic-ui-react";
import { toast } from "react-toastify";
import { EntryImages, Party, Record as WithIdRecord, SelectOption } from "../common/types";
import { Url, VehicleTypeOptions } from "../common/constants";
import { createNewEntry } from "../operations/fetch";
import { handleError, handleJsonResponse, handleResponse, MandiOptionsMapper } from "../operations/utils";
import "./newentry.css";

const maxImageSizeBytes = 20 * 1024 * 1024;

type FormFields = {
    seller: string;
    weight: string;
    bags: string;
    vehicleNumber: string;
    vehicleType: string;
    party: string;
};

type FieldName = keyof FormFields;
type FieldErrors = Partial<Record<FieldName, string>>;
type TouchedFields = Partial<Record<FieldName, boolean>>;

const initialFormValues: FormFields = {
    seller: "",
    weight: "",
    bags: "",
    vehicleNumber: "",
    vehicleType: "",
    party: ""
};

const validateSingleField = (name: FieldName, value: string): string | undefined => {
    const trimmed = value.trim();

    switch (name) {
        case "seller":
            if (!trimmed) return "विक्रेता (किसान) का नाम आवश्यक है।";
            if (trimmed.length < 3) return "विक्रेता का नाम कम से कम 3 अक्षरों का होना चाहिए।";
            return undefined;

        case "weight": {
            if (!trimmed) return "वजन दर्ज करना आवश्यक है।";
            const num = Number(trimmed);
            if (!Number.isFinite(num) || num <= 0) return "कृपया मान्य वजन (0 से अधिक) दर्ज करें।";
            if (!Number.isInteger(num)) return "कृपया वजन पूर्ण संख्या (क्विंटल) में दर्ज करें।";
            return undefined;
        }

        case "bags": {
            if (!trimmed) return "पैकेट की संख्या दर्ज करना आवश्यक है।";
            const num = Number(trimmed);
            if (!Number.isFinite(num) || num <= 0) return "कृपया मान्य पैकेट संख्या (1 या अधिक) दर्ज करें।";
            if (!Number.isInteger(num)) return "पैकेट की संख्या पूर्णांक होनी चाहिए।";
            return undefined;
        }

        case "vehicleNumber": {
            const normalized = trimmed.replace(/\s+/g, "").toUpperCase();
            if (!normalized) return "गाड़ी नंबर दर्ज करना आवश्यक है।";
            if (normalized.length < 6) return "गाड़ी नंबर कम से कम 6 अक्षरों/अंकों का होना चाहिए।";
            if (!/^[A-Z0-9]+$/.test(normalized)) return "गाड़ी नंबर में केवल अंग्रेजी अक्षर और अंक होने चाहिए।";
            return undefined;
        }

        case "vehicleType":
            if (!trimmed) return "कृपया वाहन का प्रकार चुनें।";
            return undefined;

        case "party":
            if (!trimmed) return "कृपया आढ़तिया फर्म का चयन करें।";
            return undefined;
    }
};

const validateAllFields = (values: FormFields): FieldErrors => {
    const errors: FieldErrors = {};
    (Object.keys(values) as FieldName[]).forEach((field) => {
        const error = validateSingleField(field, values[field]);
        if (error) errors[field] = error;
    });
    return errors;
};

const formatFileSize = (bytes: number): string => {
    if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const NewEntry: React.FC = () => {
    const [values, setValues] = useState<FormFields>(initialFormValues);
    const [touched, setTouched] = useState<TouchedFields>({});
    const [errors, setErrors] = useState<FieldErrors>({});
    const [mandiOptions, setMandiOptions] = useState<SelectOption[]>([]);
    const [isMandiLoading, setIsMandiLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [images, setImages] = useState<EntryImages>({});
    const [imagePreviews, setImagePreviews] = useState<Partial<Record<keyof EntryImages, string>>>({});
    const imagePreviewsRef = useRef<Partial<Record<keyof EntryImages, string>>>({});
    const [imageErrors, setImageErrors] = useState<Partial<Record<keyof EntryImages, string>>>({});

    const photos = [
        { field: "vehicleImage" as const, title: "वाहन की फोटो", hint: "सामने या साइड से स्पष्ट फोटो" },
        { field: "numberPlateImage" as const, title: "नंबर प्लेट की फोटो", hint: "नंबर प्लेट साफ दिखाई दे" }
    ];

    const isSupportedImage = (file: File) => /\.(jpe?g|png|heic|heif)$/i.test(file.name);

    const updateField = (name: FieldName, rawValue: string, markTouched = false) => {
        const nextValue = name === "vehicleNumber" ? rawValue.toUpperCase() : rawValue;
        setValues((prev) => ({ ...prev, [name]: nextValue }));

        if (touched[name] || markTouched) {
            if (markTouched) setTouched((prev) => ({ ...prev, [name]: true }));
            const fieldError = validateSingleField(name, nextValue);
            setErrors((prev) => ({ ...prev, [name]: fieldError }));
        }
    };

    const handleBlur = (name: FieldName) => {
        const trimmed = name === "vehicleNumber"
            ? values[name].replace(/\s+/g, "").toUpperCase()
            : values[name].trim();

        setValues((prev) => ({ ...prev, [name]: trimmed }));
        setTouched((prev) => ({ ...prev, [name]: true }));
        const fieldError = validateSingleField(name, trimmed);
        setErrors((prev) => ({ ...prev, [name]: fieldError }));
    };

    const handlePartyChange = (_event: SyntheticEvent<HTMLElement, Event>, data: DropdownProps) => {
        const selected = data.value?.toString() ?? "";
        updateField("party", selected, true);
    };

    const clearImage = (field: keyof EntryImages) => {
        setImages((current) => ({ ...current, [field]: undefined }));
        setImagePreviews((current) => {
            const currentPreview = current[field];
            if (currentPreview) URL.revokeObjectURL(currentPreview);
            return { ...current, [field]: undefined };
        });
        setImageErrors((current) => ({ ...current, [field]: undefined }));
    };

    const clearAllImages = () => {
        setImages({});
        setImagePreviews((current) => {
            Object.values(current).forEach((preview) => preview && URL.revokeObjectURL(preview));
            return {};
        });
        setImageErrors({});
    };

    const resetForm = () => {
        setValues(initialFormValues);
        setTouched({});
        setErrors({});
        clearAllImages();
    };

    const selectImage = (field: keyof EntryImages, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (!isSupportedImage(file)) {
            setImageErrors((prev) => ({
                ...prev,
                [field]: "कृपया मान्य इमेज फ़ाइल चुनें (JPG/JPEG, PNG, HEIF/HEIC)।"
            }));
            return;
        }

        if (file.size > maxImageSizeBytes) {
            setImageErrors((prev) => ({
                ...prev,
                [field]: "कृपया 20 MB या उससे छोटी फोटो चुनें।"
            }));
            return;
        }

        setImageErrors((prev) => ({ ...prev, [field]: undefined }));
        setImages((current) => ({ ...current, [field]: file }));
        setImagePreviews((current) => {
            const currentPreview = current[field];
            if (currentPreview) URL.revokeObjectURL(currentPreview);
            return { ...current, [field]: URL.createObjectURL(file) };
        });
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isSubmitting) return;

        const normalizedValues: FormFields = {
            seller: values.seller.trim(),
            weight: values.weight.trim(),
            bags: values.bags.trim(),
            vehicleNumber: values.vehicleNumber.replace(/\s+/g, "").toUpperCase(),
            vehicleType: values.vehicleType.trim(),
            party: values.party.trim()
        };

        setValues(normalizedValues);
        setTouched({
            seller: true,
            weight: true,
            bags: true,
            vehicleNumber: true,
            vehicleType: true,
            party: true
        });

        const validationErrors = validateAllFields(normalizedValues);
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            toast.error("कृपया आवश्यक जानकारी भरें।");
            return;
        }

        setIsSubmitting(true);
        createNewEntry(normalizedValues, images)
            .then(handleResponse)
            .then(() => {
                toast.success("नया गेटपास सफलतापूर्वक बनाया गया।");
                resetForm();
            })
            .catch(handleError)
            .finally(() => setIsSubmitting(false));
    };

    useEffect(() => {
        imagePreviewsRef.current = imagePreviews;
    }, [imagePreviews]);

    useEffect(() => () => {
        Object.values(imagePreviewsRef.current).forEach((preview) => preview && URL.revokeObjectURL(preview));
    }, []);

    useEffect(() => {
        setIsMandiLoading(true);
        fetch(Url.Parties)
            .then((response) => handleJsonResponse<Array<WithIdRecord<Party>>>(response))
            .then((response) => setMandiOptions(response.map(MandiOptionsMapper)))
            .catch(handleError)
            .finally(() => setIsMandiLoading(false));
    }, []);

    const getFieldStateClass = (name: FieldName): string => {
        if (!touched[name]) return "";
        return errors[name] ? "has-error" : "is-valid";
    };

    return (
        <div className="ne-v1-wrapper">
            <div className="ne-v1-card">
                <header className="ne-v1-header">
                    <div className="ne-v1-header-main">
                        <div className="ne-v1-brand-icon" aria-hidden="true">
                            <FileCheck2 size={26} strokeWidth={2} />
                        </div>
                        <div className="ne-v1-title-group">
                            <h1>नया गेटपास बनाएं</h1>
                            <p>ई-मंडी आवक एवं वाहन प्रविष्टि फॉर्म</p>
                        </div>
                    </div>
                </header>

                <form className="ne-v1-form" onSubmit={handleSubmit} autoComplete="off" noValidate>
                    {/* Section 1: Seller & Commodity Details */}
                    <section className="ne-v1-section" aria-label="किसान एवं माल का विवरण">
                        <div className="ne-v1-section-header">
                            <h2 className="ne-v1-section-title">
                                <User size={16} />
                                <span>किसान एवं माल का विवरण</span>
                            </h2>
                        </div>

                        <div className="ne-v1-grid-2">
                            <div className={`ne-v1-field full-width ${getFieldStateClass("seller")}`}>
                                <div className="ne-v1-label-row">
                                    <label htmlFor="ne-v1-seller" className="ne-v1-label">
                                        विक्रेता का नाम (किसान) <span className="ne-v1-required">*</span>
                                    </label>
                                    <span className="ne-v1-field-hint">न्यूनतम 3 अक्षर</span>
                                </div>
                                <div className="ne-v1-input-wrap">
                                    <span className="ne-v1-input-icon"><User size={17} /></span>
                                    <input
                                        id="ne-v1-seller"
                                        name="seller"
                                        type="text"
                                        required
                                        disabled={isSubmitting}
                                        className="ne-v1-input"
                                        placeholder="विक्रेता का नाम"
                                        value={values.seller}
                                        aria-invalid={Boolean(touched.seller && errors.seller)}
                                        aria-describedby={touched.seller && errors.seller ? "ne-v1-seller-error" : undefined}
                                        onChange={(e) => updateField("seller", e.target.value)}
                                        onBlur={() => handleBlur("seller")}
                                    />
                                </div>
                                {touched.seller && errors.seller && (
                                    <p id="ne-v1-seller-error" className="ne-v1-error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.seller}
                                    </p>
                                )}
                            </div>

                            <div className={`ne-v1-field ${getFieldStateClass("weight")}`}>
                                <div className="ne-v1-label-row">
                                    <label htmlFor="ne-v1-weight" className="ne-v1-label">
                                        वजन <span className="ne-v1-required">*</span>
                                    </label>
                                </div>
                                <div className="ne-v1-input-wrap">
                                    <span className="ne-v1-input-icon"><Scale size={17} /></span>
                                    <input
                                        id="ne-v1-weight"
                                        name="weight"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        step="1"
                                        required
                                        disabled={isSubmitting}
                                        className="ne-v1-input with-suffix"
                                        placeholder="वजन दर्ज करें"
                                        value={values.weight}
                                        aria-invalid={Boolean(touched.weight && errors.weight)}
                                        aria-describedby={touched.weight && errors.weight ? "ne-v1-weight-error" : undefined}
                                        onChange={(e) => updateField("weight", e.target.value)}
                                        onBlur={() => handleBlur("weight")}
                                    />
                                    <span className="ne-v1-unit-badge">क्विंटल</span>
                                </div>
                                {touched.weight && errors.weight && (
                                    <p id="ne-v1-weight-error" className="ne-v1-error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.weight}
                                    </p>
                                )}
                            </div>

                            <div className={`ne-v1-field ${getFieldStateClass("bags")}`}>
                                <div className="ne-v1-label-row">
                                    <label htmlFor="ne-v1-bags" className="ne-v1-label">
                                        पैकेट की संख्या <span className="ne-v1-required">*</span>
                                    </label>
                                </div>
                                <div className="ne-v1-input-wrap">
                                    <span className="ne-v1-input-icon"><Package size={17} /></span>
                                    <input
                                        id="ne-v1-bags"
                                        name="bags"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        step="1"
                                        required
                                        disabled={isSubmitting}
                                        className="ne-v1-input with-suffix"
                                        placeholder="पैकेट की संख्या"
                                        value={values.bags}
                                        aria-invalid={Boolean(touched.bags && errors.bags)}
                                        aria-describedby={touched.bags && errors.bags ? "ne-v1-bags-error" : undefined}
                                        onChange={(e) => updateField("bags", e.target.value)}
                                        onBlur={() => handleBlur("bags")}
                                    />
                                    <span className="ne-v1-unit-badge">बोरी / कट्टे</span>
                                </div>
                                {touched.bags && errors.bags && (
                                    <p id="ne-v1-bags-error" className="ne-v1-error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.bags}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Vehicle & Party Details */}
                    <section className="ne-v1-section" aria-label="वाहन एवं आढ़तिया फर्म विवरण">
                        <div className="ne-v1-section-header">
                            <h2 className="ne-v1-section-title">
                                <Truck size={16} />
                                <span>वाहन एवं आढ़तिया फर्म विवरण</span>
                            </h2>
                        </div>

                        <div className="ne-v1-grid-2">
                            <div className={`ne-v1-field full-width ${getFieldStateClass("vehicleNumber")}`}>
                                <div className="ne-v1-label-row">
                                    <label htmlFor="ne-v1-vehicleNumber" className="ne-v1-label">
                                        गाड़ी नंबर <span className="ne-v1-required">*</span>
                                    </label>
                                    <span className="ne-v1-field-hint">बिना स्पेस के (न्यूनतम 6 अक्षर)</span>
                                </div>
                                <div className="ne-v1-input-wrap">
                                    <span className="ne-v1-input-icon"><Hash size={17} /></span>
                                    <input
                                        id="ne-v1-vehicleNumber"
                                        name="vehicleNumber"
                                        type="text"
                                        required
                                        disabled={isSubmitting}
                                        className="ne-v1-input uppercase"
                                        placeholder="गाड़ी नंबर"
                                        value={values.vehicleNumber}
                                        aria-invalid={Boolean(touched.vehicleNumber && errors.vehicleNumber)}
                                        aria-describedby={touched.vehicleNumber && errors.vehicleNumber ? "ne-v1-vehicleNumber-error" : undefined}
                                        onChange={(e) => updateField("vehicleNumber", e.target.value)}
                                        onBlur={() => handleBlur("vehicleNumber")}
                                    />
                                </div>
                                {touched.vehicleNumber && errors.vehicleNumber && (
                                    <p id="ne-v1-vehicleNumber-error" className="ne-v1-error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.vehicleNumber}
                                    </p>
                                )}
                            </div>

                            <div className={`ne-v1-field full-width ${getFieldStateClass("vehicleType")}`}>
                                <div className="ne-v1-label-row">
                                    <label className="ne-v1-label">
                                        वाहन का प्रकार <span className="ne-v1-required">*</span>
                                    </label>
                                </div>
                                <div className="ne-v1-select-wrap">
                                    <Dropdown
                                        selection
                                        clearable
                                        disabled={isSubmitting}
                                        placeholder="वाहन का प्रकार चुनें"
                                        options={VehicleTypeOptions}
                                        value={values.vehicleType || undefined}
                                        text={VehicleTypeOptions.find((option) => option.value === values.vehicleType)?.text}
                                        onChange={(_event, data) => updateField("vehicleType", data.value?.toString() ?? "", true)}
                                    />
                                    <span className="ne-v1-input-icon"><Truck size={17} /></span>
                                </div>
                                {touched.vehicleType && errors.vehicleType && (
                                    <p className="ne-v1-error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.vehicleType}
                                    </p>
                                )}
                            </div>

                            <div className={`ne-v1-field full-width ${getFieldStateClass("party")}`}>
                                <div className="ne-v1-label-row">
                                    <label className="ne-v1-label">
                                        आढ़तिया फर्म का नाम <span className="ne-v1-required">*</span>
                                    </label>
                                    <span className="ne-v1-field-hint">फर्म या मंडी खोजें</span>
                                </div>
                                <div className="ne-v1-select-wrap">
                                    <Dropdown
                                        selection
                                        search
                                        clearable
                                        disabled={isSubmitting}
                                        loading={isMandiLoading}
                                        placeholder="आढ़तिया फर्म का चयन करें"
                                        noResultsMessage="कोई फर्म नहीं मिली"
                                        options={mandiOptions}
                                        value={values.party || undefined}
                                        text={mandiOptions.find((option) => option.value === values.party)?.text}
                                        onChange={handlePartyChange}
                                    />
                                    <span className="ne-v1-input-icon"><Building2 size={17} /></span>
                                </div>
                                {touched.party && errors.party && (
                                    <p className="ne-v1-error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.party}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Vehicle & Plate Photos */}
                    <section className="ne-v1-section" aria-label="वाहन और नंबर प्लेट की फोटो">
                        <div className="ne-v1-section-header">
                            <h2 className="ne-v1-section-title">
                                <Camera size={16} />
                                <span>वाहन एवं नंबर प्लेट की फोटो</span>
                            </h2>
                        </div>

                        <div className="ne-v1-photos-grid">
                            {photos.map(({ field, title, hint }, index) => {
                                const file = images[field];
                                const preview = imagePreviews[field];
                                const fieldImgError = imageErrors[field];

                                return (
                                    <div
                                        key={field}
                                        className={`ne-v1-photo-card${file ? " has-image" : ""}${fieldImgError ? " has-error" : ""}`}
                                        aria-busy={isSubmitting}
                                    >
                                        <div className="ne-v1-photo-header">
                                            <div className="ne-v1-photo-title">
                                                <span className="ne-v1-photo-step">{index + 1}</span>
                                                <h3>{title}</h3>
                                            </div>
                                            {file && <span className="ne-v1-photo-size">{formatFileSize(file.size)}</span>}
                                        </div>

                                        <div className={`ne-v1-photo-dropzone${file ? " has-image" : ""}`}>
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.heic,.heif"
                                                aria-label={title}
                                                aria-describedby={fieldImgError ? `${field}-v1-error` : undefined}
                                                disabled={isSubmitting}
                                                onChange={(event) => selectImage(field, event)}
                                            />
                                            {preview ? (
                                                <img src={preview} alt={title} />
                                            ) : (
                                                <>
                                                    <ImagePlus size={26} aria-hidden="true" />
                                                    <span className="ne-v1-photo-cta">फोटो चुनें या अपलोड करें</span>
                                                    <span className="ne-v1-photo-hint">{hint}</span>
                                                </>
                                            )}

                                            {file && (
                                                <div className="ne-v1-photo-actions">
                                                    <button
                                                        type="button"
                                                        className="ne-v1-photo-btn edit"
                                                        aria-label={`${title} बदलें`}
                                                        disabled={isSubmitting}
                                                        onClick={(event) => {
                                                            event.currentTarget.closest(".ne-v1-photo-dropzone")?.querySelector("input")?.click();
                                                        }}
                                                    >
                                                        <Pencil size={14} aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="ne-v1-photo-btn remove"
                                                        aria-label={`${title} हटाएं`}
                                                        disabled={isSubmitting}
                                                        onClick={() => clearImage(field)}
                                                    >
                                                        <Trash2 size={14} aria-hidden="true" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {fieldImgError && (
                                            <p id={`${field}-v1-error`} className="ne-v1-error-msg" style={{ marginTop: "0.5rem" }} role="alert">
                                                <AlertCircle size={14} /> {fieldImgError}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <div className="ne-v1-actions">
                        <button
                            type="button"
                            className="ne-v1-btn-reset"
                            disabled={isSubmitting}
                            onClick={resetForm}
                        >
                            <RotateCcw size={16} />
                            <span>रीसेट करें</span>
                        </button>
                        <button
                            type="submit"
                            className="ne-v1-btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="ne-v1-spin" />
                                    <span>गेटपास जारी हो रहा है...</span>
                                </>
                            ) : (
                                <>
                                    <Send size={17} />
                                    <span>गेटपास जारी करें</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

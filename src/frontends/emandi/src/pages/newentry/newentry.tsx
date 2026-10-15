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
import { EntryImages, Party, Record as WithIdRecord, SelectOption } from "../../common/types";
import { Url, VehicleTypeOptions } from "../../common/constants";
import { createNewEntry } from "../../operations/fetch";
import { handleError, handleJsonResponse, handleResponse, MandiOptionsMapper } from "../../operations/utils";
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
    const [dropdownResetKey, setDropdownResetKey] = useState(0);

    const [images, setImages] = useState<EntryImages>({});
    const [imagePreviews, setImagePreviews] = useState<Partial<Record<keyof EntryImages, string>>>({});
    const imagePreviewsRef = useRef<Partial<Record<keyof EntryImages, string>>>({});
    const [imageErrors, setImageErrors] = useState<Partial<Record<keyof EntryImages, string>>>({});

    const photos = [
        { field: "vehicleImage" as const, title: "वाहन की फोटो", hint: "सामने या साइड से स्पष्ट फोटो" },
        { field: "numberPlateImage" as const, title: "नंबर प्लेट की फोटो", hint: "नंबर प्लेट साफ दिखाई दे" }
    ];

    const isSupportedImage = (file: File) => file.type.startsWith("image/") || /\.(jpe?g|png|heic|heif)$/i.test(file.name);

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
        setDropdownResetKey((current) => current + 1);
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

    useEffect(() => {
        if (!("geolocation" in navigator)) {
            console.warn("Geolocation is not supported by this browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log("Captured coordinates:", {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy
                });
            },
            (error) => {
                console.warn("Failed to obtain location:", error.message);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }, []);

    const getFieldStateClass = (name: FieldName): string => {
        if (!touched[name]) return "";
        return errors[name] ? "has-error" : "is-valid";
    };

    return (
        <div className="wrapper">
            <div className="card">
                <header className="header">
                    <div className="header-main">
                        <div className="brand-icon" aria-hidden="true">
                            <FileCheck2 size={26} strokeWidth={2} />
                        </div>
                        <div className="title-group">
                            <h1>नया गेटपास बनाएं</h1>
                            <p>ई-मंडी आवक एवं वाहन प्रविष्टि फॉर्म</p>
                        </div>
                    </div>
                </header>

                <form className="form" onSubmit={handleSubmit} autoComplete="off" noValidate>
                    {/* Section 1: Seller & Commodity Details */}
                    <section className="section" aria-label="किसान एवं माल का विवरण">
                        <div className="section-header">
                            <h2 className="section-title">
                                <User size={16} />
                                <span>किसान एवं माल का विवरण</span>
                            </h2>
                        </div>

                        <div className="grid-2">
                            <div className={`field full-width ${getFieldStateClass("seller")}`}>
                                <div className="label-row">
                                    <label htmlFor="seller" className="label">
                                        विक्रेता का नाम (किसान) <span className="required">*</span>
                                    </label>
                                    <span className="field-hint">न्यूनतम 3 अक्षर</span>
                                </div>
                                <div className="input-wrap">
                                    <span className="input-icon"><User size={17} /></span>
                                    <input
                                        id="seller"
                                        name="seller"
                                        type="text"
                                        required
                                        disabled={isSubmitting}
                                        className="input"
                                        placeholder="विक्रेता का नाम"
                                        value={values.seller}
                                        aria-invalid={Boolean(touched.seller && errors.seller)}
                                        aria-describedby={touched.seller && errors.seller ? "seller-error" : undefined}
                                        onChange={(e) => updateField("seller", e.target.value)}
                                        onBlur={() => handleBlur("seller")}
                                    />
                                </div>
                                {touched.seller && errors.seller && (
                                    <p id="seller-error" className="error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.seller}
                                    </p>
                                )}
                            </div>

                            <div className={`field ${getFieldStateClass("weight")}`}>
                                <div className="label-row">
                                    <label htmlFor="weight" className="label">
                                        वजन <span className="required">*</span>
                                    </label>
                                </div>
                                <div className="input-wrap">
                                    <span className="input-icon"><Scale size={17} /></span>
                                    <input
                                        id="weight"
                                        name="weight"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        step="1"
                                        required
                                        disabled={isSubmitting}
                                        className="input with-suffix"
                                        placeholder="वजन दर्ज करें"
                                        value={values.weight}
                                        aria-invalid={Boolean(touched.weight && errors.weight)}
                                        aria-describedby={touched.weight && errors.weight ? "weight-error" : undefined}
                                        onChange={(e) => updateField("weight", e.target.value)}
                                        onBlur={() => handleBlur("weight")}
                                    />
                                    <span className="unit-badge">क्विंटल</span>
                                </div>
                                {touched.weight && errors.weight && (
                                    <p id="weight-error" className="error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.weight}
                                    </p>
                                )}
                            </div>

                            <div className={`field ${getFieldStateClass("bags")}`}>
                                <div className="label-row">
                                    <label htmlFor="bags" className="label">
                                        पैकेट की संख्या <span className="required">*</span>
                                    </label>
                                </div>
                                <div className="input-wrap">
                                    <span className="input-icon"><Package size={17} /></span>
                                    <input
                                        id="bags"
                                        name="bags"
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        step="1"
                                        required
                                        disabled={isSubmitting}
                                        className="input with-suffix"
                                        placeholder="पैकेट की संख्या"
                                        value={values.bags}
                                        aria-invalid={Boolean(touched.bags && errors.bags)}
                                        aria-describedby={touched.bags && errors.bags ? "bags-error" : undefined}
                                        onChange={(e) => updateField("bags", e.target.value)}
                                        onBlur={() => handleBlur("bags")}
                                    />
                                    <span className="unit-badge">बोरी / कट्टे</span>
                                </div>
                                {touched.bags && errors.bags && (
                                    <p id="bags-error" className="error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.bags}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Vehicle & Party Details */}
                    <section className="section" aria-label="वाहन एवं आढ़तिया फर्म विवरण">
                        <div className="section-header">
                            <h2 className="section-title">
                                <Truck size={16} />
                                <span>वाहन एवं आढ़तिया फर्म विवरण</span>
                            </h2>
                        </div>

                        <div className="grid-2">
                            <div className={`field full-width ${getFieldStateClass("vehicleNumber")}`}>
                                <div className="label-row">
                                    <label htmlFor="vehicleNumber" className="label">
                                        गाड़ी नंबर <span className="required">*</span>
                                    </label>
                                    <span className="field-hint">बिना स्पेस के (न्यूनतम 6 अक्षर)</span>
                                </div>
                                <div className="input-wrap">
                                    <span className="input-icon"><Hash size={17} /></span>
                                    <input
                                        id="vehicleNumber"
                                        name="vehicleNumber"
                                        type="text"
                                        required
                                        disabled={isSubmitting}
                                        className="input uppercase"
                                        placeholder="गाड़ी नंबर"
                                        value={values.vehicleNumber}
                                        aria-invalid={Boolean(touched.vehicleNumber && errors.vehicleNumber)}
                                        aria-describedby={touched.vehicleNumber && errors.vehicleNumber ? "vehicleNumber-error" : undefined}
                                        onChange={(e) => updateField("vehicleNumber", e.target.value)}
                                        onBlur={() => handleBlur("vehicleNumber")}
                                    />
                                </div>
                                {touched.vehicleNumber && errors.vehicleNumber && (
                                    <p id="vehicleNumber-error" className="error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.vehicleNumber}
                                    </p>
                                )}
                            </div>

                            <div className={`field full-width ${getFieldStateClass("vehicleType")}`}>
                                <div className="label-row">
                                    <label className="label">
                                        वाहन का प्रकार <span className="required">*</span>
                                    </label>
                                </div>
                                <div className="select-wrap">
                                    <Dropdown
                                        key={`vehicle-type-${dropdownResetKey}`}
                                        selection
                                        clearable
                                        disabled={isSubmitting}
                                        placeholder="वाहन का प्रकार चुनें"
                                        options={VehicleTypeOptions}
                                        value={values.vehicleType || undefined}
                                        text={VehicleTypeOptions.find((option) => option.value === values.vehicleType)?.text}
                                        onChange={(_event, data) => updateField("vehicleType", data.value?.toString() ?? "", true)}
                                    />
                                    <span className="input-icon"><Truck size={17} /></span>
                                </div>
                                {touched.vehicleType && errors.vehicleType && (
                                    <p className="error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.vehicleType}
                                    </p>
                                )}
                            </div>

                            <div className={`field full-width ${getFieldStateClass("party")}`}>
                                <div className="label-row">
                                    <label className="label">
                                        आढ़तिया फर्म का नाम <span className="required">*</span>
                                    </label>
                                    <span className="field-hint">फर्म या मंडी खोजें</span>
                                </div>
                                <div className="select-wrap">
                                    <Dropdown
                                        key={`party-${dropdownResetKey}`}
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
                                    <span className="input-icon"><Building2 size={17} /></span>
                                </div>
                                {touched.party && errors.party && (
                                    <p className="error-msg" role="alert">
                                        <AlertCircle size={14} /> {errors.party}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Vehicle & Plate Photos */}
                    <section className="section" aria-label="वाहन और नंबर प्लेट की फोटो">
                        <div className="section-header">
                            <h2 className="section-title">
                                <Camera size={16} />
                                <span>वाहन एवं नंबर प्लेट की फोटो</span>
                            </h2>
                        </div>

                        <div className="photos-grid">
                            {photos.map(({ field, title, hint }, index) => {
                                const file = images[field];
                                const preview = imagePreviews[field];
                                const fieldImgError = imageErrors[field];

                                return (
                                    <div
                                        key={field}
                                        className={`photo-card${file ? " has-image" : ""}${fieldImgError ? " has-error" : ""}`}
                                        aria-busy={isSubmitting}
                                    >
                                        <div className="photo-header">
                                            <div className="photo-title">
                                                <span className="photo-step">{index + 1}</span>
                                                <h3>{title}</h3>
                                            </div>
                                            {file && <span className="photo-size">{formatFileSize(file.size)}</span>}
                                        </div>

                                        <div className={`photo-dropzone${file ? " has-image" : ""}`}>
                                            <input
                                                type="file"
                                                accept="image/*,.heic,.heif"
                                                aria-label={title}
                                                aria-describedby={fieldImgError ? `${field}-error` : undefined}
                                                disabled={isSubmitting}
                                                onChange={(event) => selectImage(field, event)}
                                            />
                                            {preview ? (
                                                <img src={preview} alt={title} />
                                            ) : (
                                                <>
                                                    <ImagePlus size={26} aria-hidden="true" />
                                                    <span className="photo-cta">फोटो चुनें या अपलोड करें</span>
                                                    <span className="photo-hint">{hint}</span>
                                                </>
                                            )}

                                            {file && (
                                                <div className="photo-actions">
                                                    <button
                                                        type="button"
                                                        className="photo-btn edit"
                                                        aria-label={`${title} बदलें`}
                                                        disabled={isSubmitting}
                                                        onClick={(event) => {
                                                            event.currentTarget.closest(".photo-dropzone")?.querySelector("input")?.click();
                                                        }}
                                                    >
                                                        <Pencil size={14} aria-hidden="true" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="photo-btn remove"
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
                                            <p id={`${field}-error`} className="error-msg" style={{ marginTop: "0.5rem" }} role="alert">
                                                <AlertCircle size={14} /> {fieldImgError}
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    <div className="actions">
                        <button
                            type="button"
                            className="btn-reset"
                            disabled={isSubmitting}
                            onClick={resetForm}
                        >
                            <RotateCcw size={16} />
                            <span>रीसेट करें</span>
                        </button>
                        <button
                            type="submit"
                            className="btn-submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="spin" />
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

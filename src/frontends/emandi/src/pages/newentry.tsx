import { BaseSyntheticEvent, ChangeEvent, useEffect, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { Form, Input, Divider, Button } from "semantic-ui-react";
import { CustomForm, CustomSelect } from "../common/components";
import { EntryImages, Party, Record, SelectOption } from "../common/types";
import { Url, VehicleTypeOptions } from "../common/constants";
import { createNewEntry } from "../operations/fetch";
import { prepareEntryImage } from "../operations/images";
import "./newentry.css";
import { isFormValid, getFormData, handleResponse, handleError, handleJsonResponse, trimInput, triggerValidation, MandiOptionsMapper, ReactState } from "../operations/utils";

export const NewEntry: React.FC = () => {
    const mandiOptions = ReactState<SelectOption[]>([]);
    const isMandiLoading = ReactState(true);
    const isFormLoading = ReactState(false);
    const formKey = ReactState(Math.random());
    const [images, setImages] = useState<EntryImages>({});
    const [preparingImage, setPreparingImage] = useState<keyof EntryImages | null>(null);
    const [imageError, setImageError] = useState<{ field: keyof EntryImages; message: string } | null>(null);
    const photos = [
        { field: "vehicleImage" as const, title: "वाहन की फोटो" },
        { field: "numberPlateImage" as const, title: "नंबर प्लेट की फोटो" }
    ];

    const selectImage = async (field: keyof EntryImages, event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        setPreparingImage(field);
        setImageError(null);
        try {
            const dataUrl = await prepareEntryImage(file);
            setImages(current => ({ ...current, [field]: dataUrl }));
        } catch (error) {
            setImageError({ field, message: error instanceof Error ? error.message : "फोटो तैयार नहीं हो सकी।" });
        } finally {
            setPreparingImage(null);
        }
    };

    const handleSubmit = (event: BaseSyntheticEvent) => {
        if (preparingImage || isFormLoading.get()) return;
        if (isFormValid(event)) {
            isFormLoading.set(true);
            const formData = getFormData(event);

            createNewEntry(formData, images)
                .then(handleResponse)
                .then(() => {
                    toast.success("नया गेटपास सफलतापूर्वक बनाया गया।");
                    formKey.set(Math.random());
                    setImages({});
                    setImageError(null);
                })
                .catch(handleError)
                .finally(() => isFormLoading.set(false));
        }
    }

    const fetchParties = () => {
        isMandiLoading.set(true);
        fetch(Url.Parties)
            .then(handleJsonResponse)
            .then((response: Array<Record<Party>>) => mandiOptions.set(response.map(MandiOptionsMapper)))
            .catch(handleError)
            .finally(() => isMandiLoading.set(false));
    }

    useEffect(fetchParties, []);

    return (
        <CustomForm key={formKey.get()}>
            <Form onSubmit={handleSubmit} autoComplete="off" loading={isFormLoading.get()} noValidate>
                <div className="form-header"> नया गेटपास बनाएं </div>
                <Form.Field>
                    <Input
                        required
                        name="seller"
                        type="text"
                        placeholder="विक्रेता का नाम (किसान)"
                        onBlur={trimInput}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <Input
                        required
                        name="weight"
                        type="number"
                        placeholder="वजन (क्विंटल में)"
                        onBlur={trimInput}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <Input
                        required
                        name="bags"
                        type="number"
                        placeholder="पैकेट की संख्या"
                        onBlur={trimInput}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <Input
                        required
                        name="vehicleNumber"
                        type="text"
                        placeholder="गाडी नंबर"
                        onBlur={trimInput}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <CustomSelect
                        clearable
                        required
                        name="vehicleType"
                        placeholder="वाहन का प्रकार"
                        options={VehicleTypeOptions}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <CustomSelect
                        clearable
                        required
                        name="party"
                        placeholder="आढ़तिया फर्म का नाम"
                        options={mandiOptions.get()}
                        loading={isMandiLoading.get()}
                        onChange={triggerValidation} 
                    />
                </Form.Field>
                <section className="entry-photos" aria-label="वाहन और नंबर प्लेट की फोटो">
                    <div className="entry-photos-grid">
                        {photos.map(({ field, title }, index) => (
                            <div className="entry-photo-card" key={field} aria-busy={preparingImage === field}>
                                <div className="entry-photo-title"><span>{index + 1}</span><h3>{title}</h3></div>
                                <div className={`entry-photo-select${images[field] ? " has-image" : ""}`}>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        aria-label={title}
                                        aria-describedby={imageError?.field === field ? `${field}-error` : undefined}
                                        disabled={preparingImage !== null || isFormLoading.get()}
                                        onChange={event => selectImage(field, event)}
                                    />
                                    {images[field] ? <img src={images[field]} alt={title} /> : <ImagePlus size={24} aria-hidden="true" />}
                                    {(!images[field] || preparingImage === field) && (
                                        <span className="entry-photo-select-text">
                                            {preparingImage === field ? "फोटो तैयार हो रही है…" : "फोटो चुनें"}
                                        </span>
                                    )}
                                    {images[field] && (
                                        <>
                                            <button className="entry-photo-edit" type="button" aria-label={`${title} बदलें`} disabled={preparingImage !== null || isFormLoading.get()} onClick={event => {
                                                event.currentTarget.parentElement?.querySelector("input")?.click();
                                            }}><Pencil size={14} aria-hidden="true" /></button>
                                            <button className="entry-photo-remove" type="button" aria-label={`${title} हटाएं`} disabled={preparingImage !== null || isFormLoading.get()} onClick={() => {
                                                setImages(current => ({ ...current, [field]: undefined }));
                                                if (imageError?.field === field) setImageError(null);
                                            }}><Trash2 size={14} aria-hidden="true" /></button>
                                        </>
                                    )}
                                </div>
                                {imageError?.field === field && <p id={`${field}-error`} className="entry-photo-error" role="alert">{imageError.message}</p>}
                            </div>
                        ))}
                    </div>
                    <span className="entry-photo-status" role="status">{preparingImage ? "फोटो तैयार हो रही है। कृपया प्रतीक्षा करें।" : ""}</span>
                </section>
                <Divider hidden />
                <div className="flex-full">
                    <Button color="red" type='submit' className="btn-submit" disabled={preparingImage !== null || isFormLoading.get()}> गेटपास जारी करें </Button>
                </div>
                <Divider hidden />
            </Form>
        </CustomForm>
    )
};

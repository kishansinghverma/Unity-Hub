import { useState, BaseSyntheticEvent, useRef } from "react";
import { toast } from "react-toastify";
import { InputOnChangeData, Form, Input, Divider, Button, DropdownProps, Checkbox, CheckboxProps } from "semantic-ui-react";
import { CustomForm, CustomSelect } from "../common/components";
import { DistanceResponse, SelectOption } from "../common/types";
import { ReactState, getFormData, handleError, handleJsonResponse, handleResponse, isFormValid, triggerValidation, trimInput, validateField } from "../operations/utils";
import { States } from "../common/constants";
import { getDistance, createNewParty } from "../operations/fetch";

export const NewParty: React.FC = () => {
    const isDistanceLoading = ReactState(false);
    const distance = ReactState<string>('');
    const isFormLoading = ReactState(false);
    const formKey = ReactState(Math.random());
    const isLicenceRequired = ReactState(false);
    const elementRef = useRef<Input>(null);

    const stateOptions: Array<SelectOption> = Object.keys(States).map((key) => ({ key: `state-${key}`, value: key, text: States[key] }));

    const onDistanceChange = (e: BaseSyntheticEvent, field: InputOnChangeData) => {
        distance.set(field.value);
        triggerValidation(e, field);
    }

    const onCheckboxChange = (e: BaseSyntheticEvent, field: CheckboxProps) => {
        const stateInput = document.getElementsByName('stateCode')[0] as HTMLInputElement;
        isLicenceRequired.set(stateInput.value === '1' && !field.checked as boolean);
    }

    const onStateChange = (e: BaseSyntheticEvent, field: DropdownProps) => {
        triggerValidation(e, field);
        const checkbox = document.getElementById('licence-required') as HTMLInputElement;
        isLicenceRequired.set(field.value === '1' && !checkbox.checked);
    };

    const onMandiBlur = (e: BaseSyntheticEvent) => {
        trimInput(e);
        if (e.target.value) {
            isDistanceLoading.set(true);
            getDistance(e.target.value)
                .then(response => handleJsonResponse(response, "Distance Not Available!"))
                .then((data: DistanceResponse) => {
                    const calculatedDistance = Math.ceil(data.resourceSets[0].resources[0].travelDistance).toString();
                    distance.set(calculatedDistance);
                    validateField({ ...elementRef.current?.props, value: calculatedDistance } as InputOnChangeData);
                })
                .catch(handleError)
                .finally(() => isDistanceLoading.set(false));
        }
    }

    const handleSubmit = (event: BaseSyntheticEvent) => {
        if (isFormValid(event)) {
            isFormLoading.set(true);
            const formData = getFormData(event);

            createNewParty(formData)
                .then(handleResponse)
                .then(() => {
                    toast.success("नई पार्टी सफलतापूर्वक दर्ज हो गई।");
                    formKey.set(Math.random());
                    distance.set('');
                })
                .catch(handleError)
                .finally(() => isFormLoading.set(false));
        }
    }

    return (
        <CustomForm key={formKey.get()}>
            <Form onSubmit={handleSubmit} autoComplete="off" loading={isFormLoading.get()} noValidate>
                <div className="header"> नई पार्टी जोड़ें </div>
                <Form.Field>
                    <Input
                        required
                        name="name"
                        type="text"
                        placeholder="आढ़तिया फर्म का नाम"
                        onBlur={trimInput}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <Input
                        required
                        name="mandi"
                        type="text"
                        placeholder="मंडी का नाम"
                        onBlur={onMandiBlur}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <CustomSelect
                        required
                        clearable
                        name="stateCode"
                        placeholder="राज्य का नाम"
                        options={stateOptions}
                        onChange={onStateChange}
                    />
                </Form.Field>
                <Form.Field>
                    <Input
                        required
                        name="distance"
                        type="number"
                        placeholder="दूरी"
                        loading={isDistanceLoading.get()}
                        ref={elementRef}
                        value={distance.get() || ''}
                        onBlur={trimInput}
                        onChange={onDistanceChange}
                    />
                </Form.Field>
                <Form.Field>
                    <Input
                        name="licenceNumber"
                        type="text"
                        placeholder="लाइसेंस संख्या"
                        required={isLicenceRequired.get()}
                        onBlur={trimInput}
                        onChange={triggerValidation}
                    />
                </Form.Field>
                <Form.Field>
                    <Checkbox
                        id="licence-required"
                        label="लाइसेंस नंबर की आवश्यकता नहीं है"
                        onChange={onCheckboxChange}
                    />
                </Form.Field>
                <Divider hidden />
                <div className="flex-full">
                    <Button type='submit' className="btn-submit"> पार्टी जोड़ें </Button>
                </div>
                <Divider hidden />
            </Form>
        </CustomForm>
    )
}
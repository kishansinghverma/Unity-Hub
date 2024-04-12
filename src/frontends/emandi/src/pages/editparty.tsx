import { Form, Input, Checkbox, Button, DropdownProps, InputOnChangeData } from "semantic-ui-react";
import { CustomSelect } from "../common/components";
import { useRef, BaseSyntheticEvent, useEffect } from "react";
import { States } from "../common/constants";
import { SelectOption, DistanceResponse, Party, Record } from "../common/types";
import { toast } from "react-toastify";
import { getDistance, updateParty } from "../operations/fetch";
import { triggerValidation, trimInput, handleJsonResponse, validateField, handleError, isFormValid, handleResponse, ReactState } from "../operations/utils";

export const EditPartyForm: React.FC<{ party: Record<Party>, callbackFunction: (record: Record<Party>) => void }> = ({ party, callbackFunction }) => {
    const formState = ReactState(party);
    const isDistanceLoading = ReactState(false);
    const isFormLoading = ReactState(false);
    const isLicenceRequired = ReactState(false);
    const elementRef = useRef<Input>(null);

    const stateOptions: Array<SelectOption> = Object.keys(States).map((key) => ({ key: `state-${key}`, value: key, text: States[key] }));

    const onChange = (event: BaseSyntheticEvent, field: DropdownProps | InputOnChangeData) => {
        formState.set({ ...formState.get(), [field.name]: field.value });
        triggerValidation(event, field);
    }

    const setLicenceRequired = () => {
        const stateInput = document.getElementsByName('stateCode')[0] as HTMLInputElement;
        const checkboxInput = document.getElementById('licence-required') as HTMLInputElement;
        isLicenceRequired.set(stateInput.value === '1' && !checkboxInput.checked);
    }

    const onStateChange = (e: BaseSyntheticEvent, field: DropdownProps) => {
        onChange(e, field);
        setLicenceRequired();
    };

    const onMandiBlur = (e: BaseSyntheticEvent) => {
        trimInput(e);
        if (e.target.value) {
            isDistanceLoading.set(true);
            getDistance(e.target.value)
                .then(response => handleJsonResponse(response, "Distance Not Available!"))
                .then((data: DistanceResponse) => {
                    const calculatedDistance = Math.ceil(data.resourceSets[0].resources[0].travelDistance);
                    formState.set({ ...formState.get(), distance: calculatedDistance });
                    validateField({ ...elementRef.current?.props, value: calculatedDistance.toString() } as InputOnChangeData);
                })
                .catch(handleError)
                .finally(() => isDistanceLoading.set(false));
        }
    }

    const handleSubmit = (event: BaseSyntheticEvent) => {
        if (isFormValid(event)) {
            isFormLoading.set(true);
            const { executeRequest, data } = updateParty(formState.get());

            executeRequest()
                .then(handleResponse)
                .then(() => {
                    toast.success("पार्टी सफलतापूर्वक संशोधित हो गई।");
                    callbackFunction(data)
                })
                .catch(handleError)
                .finally(() => isFormLoading.set(false));
        }
    }

    useEffect(setLicenceRequired, []);

    return (
        <Form onSubmit={handleSubmit} autoComplete="off" loading={isFormLoading.get()} noValidate>
            <Form.Field>
                <Input
                    required
                    name="name"
                    type="text"
                    placeholder="आढ़तिया फर्म का नाम"
                    value={formState.get().name}
                    onBlur={trimInput}
                    onChange={onChange}
                />
            </Form.Field>
            <Form.Field>
                <Input
                    required
                    name="mandi"
                    type="text"
                    placeholder="मंडी का नाम"
                    value={formState.get().mandi}
                    onBlur={onMandiBlur}
                    onChange={onChange}
                />
            </Form.Field>
            <Form.Field>
                <CustomSelect
                    required
                    clearable
                    name="stateCode"
                    placeholder="राज्य का नाम"
                    value={formState.get().stateCode}
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
                    value={formState.get().distance}
                    onBlur={trimInput}
                    onChange={onChange}
                />
            </Form.Field>
            <Form.Field>
                <Input
                    name="licenceNumber"
                    type="text"
                    placeholder="लाइसेंस संख्या"
                    required={isLicenceRequired.get()}
                    value={formState.get().licenceNumber}
                    onBlur={trimInput}
                    onChange={onChange}
                />
            </Form.Field>
            <Form.Field>
                <Checkbox
                    id="licence-required"
                    label="लाइसेंस नंबर की आवश्यकता नहीं है"
                    onChange={setLicenceRequired}
                />
            </Form.Field>
            <Button type='submit' id='submit-btn' style={{ display: 'none' }} />
        </Form>
    );
}
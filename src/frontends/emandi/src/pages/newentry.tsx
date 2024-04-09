import { BaseSyntheticEvent, useEffect } from "react";
import { toast } from "react-toastify";
import { Form, Input, Divider, Button } from "semantic-ui-react";
import { CustomForm, CustomSelect } from "../common/components";
import { Party, Record, SelectOption } from "../common/types";
import { Url, VehicleTypeOptions } from "../common/constants";
import { createNewEntry } from "../operations/fetch";
import { isFormValid, getFormData, handleResponse, handleError, handleJsonResponse, trimInput, triggerValidation, MandiOptionsMapper, ReactState } from "../operations/utils";

export const NewEntry: React.FC = () => {
    const mandiOptions = ReactState<SelectOption[]>([]);
    const isMandiLoading = ReactState(true);
    const isFormLoading = ReactState(false);
    const formKey = ReactState(Math.random());

    const handleSubmit = (event: BaseSyntheticEvent) => {
        if (isFormValid(event)) {
            isFormLoading.set(true);
            const formData = getFormData(event);

            createNewEntry(formData)
                .then(handleResponse)
                .then(() => {
                    toast.success("नया गेटपास सफलतापूर्वक बनाया गया।");
                    formKey.set(Math.random());
                    const { name, mandi, state } = JSON.parse(formData.party);
                    //notifyViaWhatsApp(`New Gatepass Requested For ${name}, ${mandi}, ${state}. Click To Proceed : https://emandi.up.gov.in/Traders/Dashboard`);
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
                <div className="header"> नया गेटपास बनाएं </div>
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
                <Form.Field>
                    <Input
                        name="driverMobile"
                        type="number"
                        placeholder="ड्राइवर का मोबाइल नंबर"
                        onBlur={trimInput}
                        onChange={triggerValidation} />
                </Form.Field>
                <Divider hidden />
                <div className="flex-full">
                    <Button color="red" type='submit' className="btn-submit"> गेटपास जारी करें </Button>
                </div>
                <Divider hidden />
            </Form>
        </CustomForm>
    )
};
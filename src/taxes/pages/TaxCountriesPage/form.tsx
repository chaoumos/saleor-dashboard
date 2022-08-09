import { useExitFormDialog } from "@saleor/components/Form/useExitFormDialog";
import {
  TaxClassFragment,
  TaxClassRateInput,
  TaxCountryConfigurationFragment,
} from "@saleor/graphql";
import useForm, { SubmitPromise } from "@saleor/hooks/useForm";
import useFormset from "@saleor/hooks/useFormset";
import useHandleFormSubmit from "@saleor/hooks/useHandleFormSubmit";
import React from "react";

export interface TaxCountriesPageFormData {
  rates: Array<{
    rate: string;
    taxClass: Omit<TaxClassFragment, "countries">;
  }>;
  country: string;
}

interface TaxCountriesFormProps {
  children: (props: any) => React.ReactNode;
  country: TaxCountryConfigurationFragment;
  onSubmit: (data: any) => SubmitPromise;
  disabled: boolean;
}

function useTaxCountriesForm(
  country: TaxCountryConfigurationFragment,
  onSubmit,
  disabled,
) {
  // Initial
  const initialFormsetData = country?.taxClassCountryRates.map(item => ({
    id: item.taxClass.id,
    label: item.taxClass.name,
    value: item.rate?.toString() ?? "",
    data: null,
  }));

  const { formId, triggerChange } = useForm({}, undefined, {
    confirmLeave: true,
  });

  const formset = useFormset(initialFormsetData);

  // Handlers
  const handleRateChange = (id: string, value: string) => {
    triggerChange();
    formset.change(id, value);
  };

  // Submit
  const submitData = formset.data.map(item => {
    const { id, value } = item;
    const parsedRate = parseFloat(value);
    return {
      taxClassId: id,
      rate: isNaN(parsedRate) ? undefined : parsedRate,
    };
  });

  const handleSubmit = async (data: TaxClassRateInput[]) => {
    const errors = await onSubmit(data);

    return errors;
  };

  const handleFormSubmit = useHandleFormSubmit({
    formId,
    onSubmit: handleSubmit,
  });

  const submit = () => handleFormSubmit(submitData);

  // Exit form util

  const { setExitDialogSubmitRef, setIsSubmitDisabled } = useExitFormDialog({
    formId,
  });

  React.useEffect(() => setExitDialogSubmitRef(submit), [
    setExitDialogSubmitRef,
    submit,
  ]);
  setIsSubmitDisabled(disabled);

  return { data: formset.data, handlers: { handleRateChange }, submit };
}

const TaxCountriesForm: React.FC<TaxCountriesFormProps> = ({
  children,
  country,
  onSubmit,
  disabled,
}) => {
  const props = useTaxCountriesForm(country, onSubmit, disabled);

  return <form onSubmit={props.submit}>{children(props)}</form>;
};

TaxCountriesForm.displayName = "TaxCountriesForm";
export default TaxCountriesForm;

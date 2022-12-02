import { Field } from "formik";
import { MeasurementControl } from "../MeasurementControl";
import React from "react";
import { ErrorMessageComponent } from "../ErrorMessage";
import { FieldWrapper } from "./styling";

const validateMemory = value => {
  let error;
  if (value.startsWith("0")) {
    error = 'Memory can"t be 0, you have to add positive number only';
  }
  return error;
}

export const Memory = ({currentProfile, disabled}) => {
  return (
    <FieldWrapper>
      <Field
        name={`sdl.profiles.compute.${currentProfile}.resources.memory.size`}
        id="memory"
        validate={validateMemory}
      >
        {({field, form, meta}) => {
          return (
            <React.Fragment>
              <MeasurementControl
                error={meta?.error}
                title="Memory"
                subTitle="Memory Required"
                setFieldValue={form.setFieldValue}
                withPowerOfTwo
                disabled={disabled}
                {...field}
              />
              {meta?.error && (
                <ErrorMessageComponent>
                  {meta?.error}
                </ErrorMessageComponent>
              )}
            </React.Fragment>
          )
        }}
      </Field>
    </FieldWrapper>
  );
};
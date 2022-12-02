import { Field } from "formik";
import React from "react";
import styled from "@emotion/styled";
import { ErrorMessageComponent } from "../ErrorMessage";
import { FieldWrapper, Input } from "./styling";

const validateImage = value => {
  let error;
  if (!value) {
    error = 'Image can"t be empty, you have to add app image to make deployment work';
  }
  return error;
}

export const Image = ({currentProfile}) => {
  return (
    <Field
      name={`sdl.services.${currentProfile}.image`}
      validate={validateImage}
      id="image"
    >
      {({field, meta}) => (
        <FieldWrapperImage>
          <InputField error={meta?.error}
            style={{
              borderStartStartRadius: 0,
              borderEndStartRadius: 0
            }}
            type="text"
            {...field}
          />
          {meta?.error && (
            <ErrorMessageComponent>
              {meta?.error}
            </ErrorMessageComponent>
          )}
        </FieldWrapperImage>
      )}
    </Field>
  );
};

const FieldWrapperImage = styled(FieldWrapper)`
  display: flex;
  align-items: start;
  flex-direction: column;
`;

const InputField = styled(Input)<{error?: boolean}>`
  width: 100%;
`;
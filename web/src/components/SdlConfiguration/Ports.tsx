import React from "react";
import { Field, FieldArray } from "formik";
import styled from "@emotion/styled";
import { FormControl, IconButton, MenuItem, Select } from "@mui/material";
import { ErrorMessageComponent } from "../ErrorMessage";
import PlusIcon from "../../assets/images/plus-icon.svg";
import Trash from "../../assets/images/icon-trash.svg";
import {
  AddNewButton,
  AddNewButtonWrapper,
  FieldWrapper,
  Input,
  Label,
  LabelTitle,
  VariableWrapper
} from "./styling";

const PlusSign = () => <img src={PlusIcon} alt="Plus Icon"/>
const TrashIcon = () => <img src={Trash} alt="Trash Icon"/>

const validatePort = (value, field) => {
  let error;
  if (value <= 0) {
    error = `${field.toUpperCase()} can"t be 0, you have to add positive number only`;
  }
  return error;
}

export const Ports = ({serviceName, services, updatePage = false}) => {
  return (
    <FieldArray
      name={`sdl.services.${serviceName}.expose`}
      render={(arrayHelpers) => (
        <React.Fragment>
          {!updatePage && <h1 className="font-medium">Ports</h1>}
          {services[serviceName]?.expose?.map((port, index) => (
            <VariableWrapper updatePage={updatePage} key={index}>
              <FieldWrapper>
                <Label htmlFor="port">
                  <LabelTitle>Port</LabelTitle>
                </Label>
                <Field
                  id="port"
                  name={`sdl.services.${serviceName}.expose.${index}.port`}
                  validate={value => validatePort(value, "port")}
                >
                  {({field, meta}) => (
                    <React.Fragment>
                      <Input type="number"{...field} error={meta?.error}/>
                      {meta?.error && (
                        <ErrorMessageComponent>
                          {meta?.error}
                        </ErrorMessageComponent>
                      )}
                    </React.Fragment>
                  )}
                </Field>
              </FieldWrapper>
              <FieldWrapper>
                <Label htmlFor="as">
                  <LabelTitle>As</LabelTitle>
                </Label>
                <Field
                  id="as"
                  name={`sdl.services.${serviceName}.expose.${index}.as`}
                  validate={value => validatePort(value, "as")}
                >
                  {({field, meta}) => (
                    <React.Fragment>
                      <Input type="number"{...field} error={meta?.error}/>
                      {meta?.error && (
                        <ErrorMessageComponent>
                          {meta?.error}
                        </ErrorMessageComponent>
                      )}
                    </React.Fragment>
                  )}
                </Field>
              </FieldWrapper>
              {services[serviceName].expose[index].to?.map((expose, i) => {
                return (
                  expose?.global && (
                    <FieldWrapper key={`sdl.services.${serviceName}`}>
                      <Label htmlFor="global">
                        <LabelTitle>Global</LabelTitle>
                      </Label>
                      <Field
                        id="global"
                        name={`sdl.services.${serviceName}.expose.${index}.to.${i}.global`}
                      >
                        {({field}) => (
                          <FormControl fullWidth style={{background: "white"}}>
                            <Select
                              labelId="to-id"{...field}
                              SelectDisplayProps={{
                                style: {
                                  padding: "11.5px 14px"
                                }
                              }}
                            >
                              <MenuItem value="true">
                                <span>true</span>
                              </MenuItem>
                              <MenuItem value="false">
                                <span>false</span>
                              </MenuItem>
                            </Select>
                          </FormControl>
                        )}
                      </Field>
                    </FieldWrapper>
                  )
                );
              })}

              <FieldWrapper>
                <Label htmlFor="host">
                  <LabelTitle>Host</LabelTitle>
                </Label>
                <HostFiledWithButton>
                  <Field id="host" name={`sdl.services.${serviceName}.expose.${index}.accept.[0]`}>
                    {({field}) => <Input {...field} value={field.value ?? ""}/>}
                  </Field>

                  <IconButton
                    sx={{
                      background: "#FFFFFF",
                      border: "1px solid #D1D5DB",
                      boxShadow: "0px 1px 2px rgb(0 0 0 / 5%)",
                      borderRadius: "6px",
                      width: "46px",
                      height: "46px",
                    }}
                    onClick={() => arrayHelpers.remove(index)}
                    aria-label="Delete port"
                  >
                    <TrashIcon/>
                  </IconButton>
                </HostFiledWithButton>
              </FieldWrapper>

            </VariableWrapper>
          ))}
          <AddNewButtonWrapper>
            <AddNewButton
              startIcon={<PlusSign/>}
              variant="outlined"
              size="small"
              onClick={() => arrayHelpers.insert((services[serviceName]?.expose?.length + 1) ?? 0, {
                port: 3000,
                as: 80,
                to: [{global: true}]
              })}
            >
              Add New Port
            </AddNewButton>
          </AddNewButtonWrapper>
        </React.Fragment>
      )}
    />
  );
};

const HostFiledWithButton = styled.div`
  display: flex;
  column-gap: 10px;
`;
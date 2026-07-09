"use client"

import { Checkbox } from "@/components/ui/checkbox"; 
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { E164Number } from "libphonenumber-js/core";
import Image from "next/image";
import DatePicker from "react-datepicker";
import { Control, Controller, ControllerFieldState, FieldValues } from "react-hook-form";
import PhoneInput from "react-phone-number-input";
import ReactQuill from "react-quill-new";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";

export enum FormFieldType {
  INPUT = "input",
  TEXTAREA = "textarea",
  PHONE_INPUT = "phoneInput",
  CHECKBOX = "checkbox",
  DATE_PICKER = "datePicker",
  SELECT = "select",
  SKELETON = "skeleton",
}

interface CustomProps {
  control: Control<any>;
  name: string;
  id?: string;
  label?: string;
  type?: string;
  description?: string;
  placeholder?: string;
  iconSrc?: string;
  iconAlt?: string;
  disabled?: boolean;
  dateFormat?: string;
  showTimeSelect?: boolean;
  autoCapitalize?: string;
  autoComplete?: string;
  autoCorrect?: string;
  children?: React.ReactNode;
  renderSkeleton?: (field: any) => React.ReactNode;
  fieldType: FormFieldType;
}

const RenderInput = ({ field, props }: { field: FieldValues; props: CustomProps }) => {
  switch (props.fieldType) {
    case FormFieldType.INPUT:
      return (
        <div className="w-full">
          <div className="flex items-center">
            {props.iconSrc && (
              <Image
                src={props.iconSrc}
                height={24}
                width={24}
                alt={props.iconAlt || "icon"}
                className="ml-2"
              />
            )}
            <div className="w-full">
              <Input
                placeholder={props.placeholder}
                type={props.type}
                {...field}
                className="w-full"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">{props.description}</p>
        </div>
      );
    case FormFieldType.TEXTAREA:
      return (
        <>
          <div className="w-full">
            {/* <Textarea
            placeholder={props.placeholder}
            {...field}
            className='shad-textArea'
            disabled={props.disabled}
          /> */}
            <ReactQuill
              value={field.value}
              onChange={field.onChange}
              theme="snow"
              className="w-full rounded"
              placeholder={props.placeholder}
            />
          </div>
          <FieldDescription>{props.description}</FieldDescription>
        </>
      );
    case FormFieldType.PHONE_INPUT:
      return (
        <>
          <div className="w-full">
            <PhoneInput
              defaultCountry="RW"
              placeholder={props.placeholder}
              international
              withCountryCallingCode
              value={field.value as E164Number | undefined}
              onChange={field.onChange}
              className="flex h-9 w-full rounded border border-b-2 border-b-input bg-accent/65 px-2 py-1 text-sm text-accent-foreground shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-b-primary focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <FieldDescription>{props.description}</FieldDescription>
        </>
      );
    case FormFieldType.CHECKBOX:
      return (
        <>
          <div className="w-full">
            <div className="flex items-center gap-4">
              <Checkbox
                id={props.name}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <label htmlFor={props.name} className="checkbox-label">
                {props.label}
              </label>
            </div>
          </div>
          <FieldDescription>{props.description}</FieldDescription>
        </>
      );
    case FormFieldType.DATE_PICKER:
      return (
        <div className="border-dark-500 bg-dark-400 flex rounded-md border">
          <Image
            src="/assets/icons/calendar.svg"
            height={24}
            width={24}
            alt="user"
            className="ml-2"
          />
          <div className="w-full">
            <DatePicker
              showTimeSelect={props.showTimeSelect ?? false}
              selected={field.value}
              onChange={(date: Date | null) => field.onChange(date)}
              timeInputLabel="Time:"
              dateFormat={props.dateFormat ?? "MM/dd/yyyy"}
              wrapperClassName="date-picker"
            />
          </div>
          <FieldDescription>{props.description}</FieldDescription>;
        </div>
      );
    case FormFieldType.SELECT:
      return (
        <>
          <div className="w-full">
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <div className="w-full">
                <SelectTrigger className="shad-select-trigger">
                  <SelectValue placeholder={props.placeholder} />
                </SelectTrigger>
              </div>
              <SelectContent className="shad-select-content">
                {props.children}
              </SelectContent>
            </Select>
          </div>
          <FieldDescription>{props.description}</FieldDescription>
        </>
      );
    case FormFieldType.SKELETON:
      return props.renderSkeleton ? props.renderSkeleton(field) : null;
    default:
      return null;
  }
};

const CustomFormField = (props: CustomProps) => {

  const { control, name, label } = props;

  return (
    <Controller
      control={control}
      name={name}
      disabled={props.disabled}
      render={({ field, fieldState}: { field: FieldValues, fieldState: ControllerFieldState }) => (
        <Field data-invalid={fieldState.invalid} className="w-full flex-1">
          {props.fieldType !== FormFieldType.CHECKBOX && label && (
            <FieldLabel htmlFor={name} className="shad-input-label">{label}</FieldLabel>
          )}
          <RenderInput field={field} props={props} />

          {fieldState.error && (
          <FieldError className="shad-error" errors={[fieldState.error]}/>
          )}
        </Field>
      )}
    />
  );
};

export default CustomFormField;

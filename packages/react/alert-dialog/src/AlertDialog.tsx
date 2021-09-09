import * as React from 'react';
import { createContext } from '@radix-ui/react-context';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { composeEventHandlers } from '@radix-ui/primitive';
import { Slottable } from '@radix-ui/react-slot';

import type * as Radix from '@radix-ui/react-primitive';

/* -------------------------------------------------------------------------------------------------
 * AlertDialog
 * -----------------------------------------------------------------------------------------------*/

const ROOT_NAME = 'AlertDialog';
const ROOT_DISPLAY_NAME = ROOT_NAME;

type DialogProps = Radix.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>;
interface AlertDialogProps extends Omit<DialogProps, 'modal'> {}

const AlertDialog: React.FC<AlertDialogProps> = (props) => {
  const { __group = ROOT_NAME, ...dialogProps } = props;
  return <DialogPrimitive.Root {...dialogProps} __group={__group} modal={true} />;
};

AlertDialog.displayName = ROOT_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogTrigger
 * -----------------------------------------------------------------------------------------------*/
const TRIGGER_NAME = 'Trigger';
const TRIGGER_DISPLAY_NAME = ROOT_NAME + TRIGGER_NAME;

type AlertDialogTriggerElement = React.ElementRef<typeof DialogPrimitive.Trigger>;
type DialogTriggerProps = Radix.ComponentPropsWithoutRef<typeof DialogPrimitive.Trigger>;
interface AlertDialogTriggerProps extends DialogTriggerProps {}

const AlertDialogTrigger = React.forwardRef<AlertDialogTriggerElement, AlertDialogTriggerProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = TRIGGER_NAME, ...triggerProps } = props;
    return (
      <DialogPrimitive.Trigger
        {...triggerProps}
        __group={__group}
        __part={__part}
        ref={forwardedRef}
      />
    );
  }
);

AlertDialogTrigger.displayName = TRIGGER_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogOverlay
 * -----------------------------------------------------------------------------------------------*/

const OVERLAY_NAME = 'Overlay';
const OVERLAY_DISPLAY_NAME = ROOT_NAME + OVERLAY_NAME;

type AlertDialogOverlayElement = React.ElementRef<typeof DialogPrimitive.Overlay>;
type DialogOverlayProps = Radix.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>;
interface AlertDialogOverlayProps extends DialogOverlayProps {}

const AlertDialogOverlay = React.forwardRef<AlertDialogOverlayElement, AlertDialogOverlayProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = OVERLAY_NAME, ...overlayProps } = props;
    return (
      <DialogPrimitive.Overlay
        {...overlayProps}
        __group={__group}
        __part={__part}
        ref={forwardedRef}
      />
    );
  }
);

AlertDialogOverlay.displayName = OVERLAY_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = 'Content';
const CONTENT_DISPLAY_NAME = ROOT_NAME + CONTENT_NAME;

type AlertDialogContentContextValue = {
  cancelRef: React.MutableRefObject<AlertDialogCancelElement | null>;
};

const [AlertDialogContentProvider, useAlertDialogContentContext] =
  createContext<AlertDialogContentContextValue>(CONTENT_NAME);

type AlertDialogContentElement = React.ElementRef<typeof DialogPrimitive.Content>;
type DialogContentProps = Radix.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>;
interface AlertDialogContentProps
  extends Omit<DialogContentProps, 'onPointerDownOutside' | 'onInteractOutside'> {}

const AlertDialogContent = React.forwardRef<AlertDialogContentElement, AlertDialogContentProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = CONTENT_NAME, children, ...contentProps } = props;
    const contentRef = React.useRef<AlertDialogContentElement>(null);
    const composedRefs = useComposedRefs(forwardedRef, contentRef);
    const cancelRef = React.useRef<AlertDialogCancelElement | null>(null);

    return (
      <DialogPrimitive.LabelWarningProvider
        group={__group}
        contentName={CONTENT_DISPLAY_NAME}
        titleName={CONTENT_DISPLAY_NAME}
        docsSlug="alert-dialog"
      >
        <AlertDialogContentProvider group={__group} cancelRef={cancelRef}>
          <DialogPrimitive.Content
            role="alertdialog"
            {...contentProps}
            __group={__group}
            __part={__part}
            ref={composedRefs}
            onOpenAutoFocus={composeEventHandlers(contentProps.onOpenAutoFocus, (event) => {
              event.preventDefault();
              cancelRef.current?.focus({ preventScroll: true });
            })}
            onPointerDownOutside={(event) => event.preventDefault()}
            onInteractOutside={(event) => event.preventDefault()}
          >
            {/**
             * We have to use `Slottable` here as we cannot wrap the `AlertDialogContentProvider`
             * around everything, otherwise the `DescriptionWarning` would be rendered straight away.
             * This is because we want the accessibility checks to run only once the content is actually
             * open and that behaviour is already encapsulated in `DialogContent`.
             */}
            <Slottable>{children}</Slottable>
            {process.env.NODE_ENV === 'development' && (
              <DescriptionWarning contentRef={contentRef} />
            )}
          </DialogPrimitive.Content>
        </AlertDialogContentProvider>
      </DialogPrimitive.LabelWarningProvider>
    );
  }
);

AlertDialogContent.displayName = CONTENT_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogTitle
 * -----------------------------------------------------------------------------------------------*/

const TITLE_NAME = 'Title';
const TITLE_DISPLAY_NAME = ROOT_NAME + TITLE_NAME;

type AlertDialogTitleElement = React.ElementRef<typeof DialogPrimitive.Title>;
type DialogTitleProps = Radix.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>;
interface AlertDialogTitleProps extends DialogTitleProps {}

const AlertDialogTitle = React.forwardRef<AlertDialogTitleElement, AlertDialogTitleProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = TITLE_NAME, ...titleProps } = props;
    return (
      <DialogPrimitive.Title {...titleProps} __group={__group} __part={__part} ref={forwardedRef} />
    );
  }
);

AlertDialogTitle.displayName = TITLE_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogDescription
 * -----------------------------------------------------------------------------------------------*/

const DESCRIPTION_NAME = 'Description';
const DESCRIPTION_DISPLAY_NAME = ROOT_NAME + DESCRIPTION_NAME;

type AlertDialogDescriptionElement = React.ElementRef<typeof DialogPrimitive.Description>;
type DialogDescriptionProps = Radix.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>;
interface AlertDialogDescriptionProps extends DialogDescriptionProps {}

const AlertDialogDescription = React.forwardRef<
  AlertDialogDescriptionElement,
  AlertDialogDescriptionProps
>((props, forwardedRef) => {
  const { __group = ROOT_NAME, __part = TITLE_NAME, ...descriptionProps } = props;
  return (
    <DialogPrimitive.Description
      {...descriptionProps}
      __group={__group}
      __part={__part}
      ref={forwardedRef}
    />
  );
});

AlertDialogDescription.displayName = DESCRIPTION_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogAction
 * -----------------------------------------------------------------------------------------------*/

const ACTION_NAME = 'Action';
const ACTION_DISPLAY_NAME = ROOT_NAME + ACTION_NAME;

type AlertDialogActionElement = React.ElementRef<typeof DialogPrimitive.Close>;
type DialogCloseProps = Radix.ComponentPropsWithoutRef<typeof DialogPrimitive.Close>;
interface AlertDialogActionProps extends DialogCloseProps {}

const AlertDialogAction = React.forwardRef<AlertDialogActionElement, AlertDialogActionProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = ACTION_NAME, ...actionProps } = props;
    return (
      <DialogPrimitive.Close
        {...actionProps}
        __group={__group}
        __part={__part}
        ref={forwardedRef}
      />
    );
  }
);

AlertDialogAction.displayName = ACTION_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * AlertDialogCancel
 * -----------------------------------------------------------------------------------------------*/

const CANCEL_NAME = 'AlertDialogCancel';
const CANCEL_DISPLAY_NAME = ROOT_NAME + CANCEL_NAME;

type AlertDialogCancelElement = React.ElementRef<typeof DialogPrimitive.Close>;
interface AlertDialogCancelProps extends DialogCloseProps {}

const AlertDialogCancel = React.forwardRef<AlertDialogCancelElement, AlertDialogCancelProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = ACTION_NAME, ...actionProps } = props;
    const { cancelRef } = useAlertDialogContentContext(__group, __part);
    const ref = useComposedRefs(forwardedRef, cancelRef);
    return <DialogPrimitive.Close {...actionProps} __group={__group} __part={__part} ref={ref} />;
  }
);

AlertDialogCancel.displayName = CANCEL_DISPLAY_NAME;

/* ---------------------------------------------------------------------------------------------- */

type DescriptionWarningProps = {
  contentRef: React.RefObject<AlertDialogContentElement>;
};

const DescriptionWarning: React.FC<DescriptionWarningProps> = ({ contentRef }) => {
  const MESSAGE = `\`${CONTENT_NAME}\` requires a description for the component to be accessible for screen reader users.

You can add a description to the \`${CONTENT_NAME}\` by passing a \`${DESCRIPTION_NAME}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a description by assigning it an \`id\` and passing the same value to the \`aria-describedby\` prop in \`${CONTENT_NAME}\`. If the description is confusing or duplicative for sighted users, you can use the \`@radix-ui/react-visually-hidden\` primitive as a wrapper around your description component.

For more information, see https://radix-ui.com/primitives/docs/components/alert-dialog`;

  React.useEffect(() => {
    const hasDescription = document.getElementById(
      contentRef.current?.getAttribute('aria-describedby')!
    );
    if (!hasDescription) console.warn(MESSAGE);
  }, [MESSAGE, contentRef]);

  return null;
};

const Root = AlertDialog;
const Trigger = AlertDialogTrigger;
const Overlay = AlertDialogOverlay;
const Content = AlertDialogContent;
const Action = AlertDialogAction;
const Cancel = AlertDialogCancel;
const Title = AlertDialogTitle;
const Description = AlertDialogDescription;

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogTitle,
  AlertDialogDescription,
  //
  Root,
  Trigger,
  Overlay,
  Content,
  Action,
  Cancel,
  Title,
  Description,
};
export type {
  AlertDialogProps,
  AlertDialogTriggerProps,
  AlertDialogOverlayProps,
  AlertDialogContentProps,
  AlertDialogActionProps,
  AlertDialogCancelProps,
  AlertDialogTitleProps,
  AlertDialogDescriptionProps,
};

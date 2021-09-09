import * as React from 'react';
import { composeEventHandlers } from '@radix-ui/primitive';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { createContext } from '@radix-ui/react-context';
import { useId } from '@radix-ui/react-id';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { DismissableLayer } from '@radix-ui/react-dismissable-layer';
import { FocusScope } from '@radix-ui/react-focus-scope';
import { Portal } from '@radix-ui/react-portal';
import { Presence } from '@radix-ui/react-presence';
import { Primitive } from '@radix-ui/react-primitive';
import { useFocusGuards } from '@radix-ui/react-focus-guards';
import { RemoveScroll } from 'react-remove-scroll';
import { hideOthers } from 'aria-hidden';

import type * as Radix from '@radix-ui/react-primitive';

/* -------------------------------------------------------------------------------------------------
 * Dialog
 * -----------------------------------------------------------------------------------------------*/

const ROOT_NAME = 'Dialog';
const ROOT_DISPLAY_NAME = ROOT_NAME;

type DialogContextValue = {
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentId: string;
  titleId: string;
  descriptionId: string;
  open: boolean;
  onOpenChange(open: boolean): void;
  onOpenToggle(): void;
  modal: boolean;
};

const [DialogProvider, useDialogContext] = createContext<DialogContextValue>(ROOT_NAME);

interface DialogProps {
  __group?: string;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?(open: boolean): void;
  modal?: boolean;
}

const Dialog: React.FC<DialogProps> = (props) => {
  const {
    __group = ROOT_NAME,
    children,
    open: openProp,
    defaultOpen,
    onOpenChange,
    modal = true,
  } = props;
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const [open = false, setOpen] = useControllableState({
    prop: openProp,
    defaultProp: defaultOpen,
    onChange: onOpenChange,
  });

  return (
    <DialogProvider
      group={__group}
      triggerRef={triggerRef}
      contentId={useId()}
      titleId={useId()}
      descriptionId={useId()}
      open={open}
      onOpenChange={setOpen}
      onOpenToggle={React.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen])}
      modal={modal}
    >
      {children}
    </DialogProvider>
  );
};

Dialog.displayName = ROOT_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = 'Trigger';
const TRIGGER_DISPLAY_NAME = ROOT_NAME + TRIGGER_NAME;

type DialogTriggerElement = React.ElementRef<typeof Primitive.button>;
type PrimitiveButtonProps = Radix.ComponentPropsWithoutRef<typeof Primitive.button>;
interface DialogTriggerProps extends PrimitiveButtonProps {}

const DialogTrigger = React.forwardRef<DialogTriggerElement, DialogTriggerProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = TRIGGER_NAME, ...triggerProps } = props;
    const context = useDialogContext(__group, __part);
    const composedTriggerRef = useComposedRefs(forwardedRef, context.triggerRef);
    return (
      <Primitive.button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={context.open}
        aria-controls={context.contentId}
        data-state={getState(context.open)}
        {...triggerProps}
        __group={__group}
        __part={__part}
        ref={composedTriggerRef}
        onClick={composeEventHandlers(props.onClick, context.onOpenToggle)}
      />
    );
  }
);

DialogTrigger.displayName = TRIGGER_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogOverlay
 * -----------------------------------------------------------------------------------------------*/

const OVERLAY_NAME = 'Overlay';
const OVERLAY_DISPLAY_NAME = ROOT_NAME + OVERLAY_NAME;

type DialogOverlayElement = DialogOverlayImplElement;
interface DialogOverlayProps extends DialogOverlayImplProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with React animation libraries.
   */
  forceMount?: true;
}

const DialogOverlay = React.forwardRef<DialogOverlayElement, DialogOverlayProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = OVERLAY_NAME, forceMount, ...overlayProps } = props;
    const context = useDialogContext(__group, __part);
    return context.modal ? (
      <Presence present={forceMount || context.open}>
        <DialogOverlayImpl {...overlayProps} __group={__group} __part={__part} ref={forwardedRef} />
      </Presence>
    ) : null;
  }
);

DialogOverlay.displayName = OVERLAY_DISPLAY_NAME;

type DialogOverlayImplElement = React.ElementRef<typeof Primitive.div>;
type PrimitiveDivProps = Radix.ComponentPropsWithoutRef<typeof Primitive.div>;
interface DialogOverlayImplProps extends PrimitiveDivProps {}

const DialogOverlayImpl = React.forwardRef<DialogOverlayImplElement, DialogOverlayImplProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = OVERLAY_NAME, ...overlayProps } = props;
    const context = useDialogContext(__group, __part);
    return (
      <Portal>
        <Primitive.div
          data-state={getState(context.open)}
          {...overlayProps}
          __group={__group}
          __part={__part}
          ref={forwardedRef}
        />
      </Portal>
    );
  }
);

/* -------------------------------------------------------------------------------------------------
 * DialogContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = 'Content';
const CONTENT_DISPLAY_NAME = ROOT_NAME + CONTENT_NAME;

type DialogContentElement = DialogContentTypeElement;
interface DialogContentProps extends DialogContentTypeProps {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with React animation libraries.
   */
  forceMount?: true;
}

const DialogContent = React.forwardRef<DialogContentElement, DialogContentProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = CONTENT_NAME, forceMount, ...contentProps } = props;
    const context = useDialogContext(__group, __part);
    return (
      <Presence present={forceMount || context.open}>
        {context.modal ? (
          <DialogContentModal
            {...contentProps}
            __group={__group}
            __part={__part}
            ref={forwardedRef}
          />
        ) : (
          <DialogContentNonModal
            {...contentProps}
            __group={__group}
            __part={__part}
            ref={forwardedRef}
          />
        )}
      </Presence>
    );
  }
);

DialogContent.displayName = CONTENT_DISPLAY_NAME;

/* -----------------------------------------------------------------------------------------------*/

type DialogContentTypeElement = DialogContentImplElement;
interface DialogContentTypeProps
  extends Omit<DialogContentImplProps, 'trapFocus' | 'disableOutsidePointerEvents'> {}

const DialogContentModal = React.forwardRef<DialogContentTypeElement, DialogContentTypeProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = CONTENT_NAME, ...contentProps } = props;
    const context = useDialogContext(__group, __part);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const composedRefs = useComposedRefs(forwardedRef, contentRef);

    // aria-hide everything except the content (better supported equivalent to setting aria-modal)
    React.useEffect(() => {
      const content = contentRef.current;
      if (content) return hideOthers(content);
    }, []);

    return (
      <Portal __group={__group} __part={__part}>
        <RemoveScroll>
          <DialogContentImpl
            {...contentProps}
            __group={__group}
            __part={__part}
            ref={composedRefs}
            // we make sure focus isn't trapped once `DialogContent` has been closed
            // (closed !== unmounted when animating out)
            trapFocus={context.open}
            disableOutsidePointerEvents
            onCloseAutoFocus={composeEventHandlers(props.onCloseAutoFocus, (event) => {
              event.preventDefault();
              context.triggerRef.current?.focus();
            })}
            onPointerDownOutside={composeEventHandlers(props.onPointerDownOutside, (event) => {
              const originalEvent = event.detail.originalEvent;
              const ctrlLeftClick = originalEvent.button === 0 && originalEvent.ctrlKey === true;
              const isRightClick = originalEvent.button === 2 || ctrlLeftClick;

              // If the event is a right-click, we shouldn't close because
              // it is effectively as if we right-clicked the `Overlay`.
              if (isRightClick) event.preventDefault();
            })}
            // When focus is trapped, a `focusout` event may still happen.
            // We make sure we don't trigger our `onDismiss` in such case.
            onFocusOutside={composeEventHandlers(props.onFocusOutside, (event) =>
              event.preventDefault()
            )}
          />
        </RemoveScroll>
      </Portal>
    );
  }
);

/* -----------------------------------------------------------------------------------------------*/

const DialogContentNonModal = React.forwardRef<DialogContentTypeElement, DialogContentTypeProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = CONTENT_NAME, ...contentProps } = props;
    const context = useDialogContext(__group, __part);
    const hasInteractedOutsideRef = React.useRef(false);

    return (
      <Portal __group={__group} __part={__part}>
        <DialogContentImpl
          {...contentProps}
          __group={__group}
          __part={__part}
          ref={forwardedRef}
          trapFocus={false}
          disableOutsidePointerEvents={false}
          onCloseAutoFocus={(event) => {
            props.onCloseAutoFocus?.(event);

            if (!event.defaultPrevented) {
              if (!hasInteractedOutsideRef.current) context.triggerRef.current?.focus();
              // Always prevent auto focus because we either focus manually or want user agent focus
              event.preventDefault();
            }

            hasInteractedOutsideRef.current = false;
          }}
          onInteractOutside={(event) => {
            props.onInteractOutside?.(event);

            if (!event.defaultPrevented) hasInteractedOutsideRef.current = true;

            // Prevent dismissing when clicking the trigger.
            // As the trigger is already setup to close, without doing so would
            // cause it to close and immediately open.
            //
            // We use `onInteractOutside` as some browsers also
            // focus on pointer down, creating the same issue.
            const target = event.target as HTMLElement;
            const targetIsTrigger = context.triggerRef.current?.contains(target);
            if (targetIsTrigger) event.preventDefault();
          }}
        />
      </Portal>
    );
  }
);

/* -----------------------------------------------------------------------------------------------*/

type DialogContentImplElement = React.ElementRef<typeof DismissableLayer>;
type DismissableLayerProps = Radix.ComponentPropsWithoutRef<typeof DismissableLayer>;
type FocusScopeProps = Radix.ComponentPropsWithoutRef<typeof FocusScope>;
interface DialogContentImplProps extends Omit<DismissableLayerProps, 'onDismiss'> {
  /**
   * When `true`, focus cannot escape the `Content` via keyboard,
   * pointer, or a programmatic focus.
   * @defaultValue false
   */
  trapFocus?: FocusScopeProps['trapped'];

  /**
   * Event handler called when auto-focusing on open.
   * Can be prevented.
   */
  onOpenAutoFocus?: FocusScopeProps['onMountAutoFocus'];

  /**
   * Event handler called when auto-focusing on close.
   * Can be prevented.
   */
  onCloseAutoFocus?: FocusScopeProps['onUnmountAutoFocus'];
}

const DialogContentImpl = React.forwardRef<DialogContentImplElement, DialogContentImplProps>(
  (props, forwardedRef) => {
    const {
      __group = ROOT_NAME,
      __part = CONTENT_NAME,
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      'aria-describedby': ariaDescribedBy,
      trapFocus,
      onOpenAutoFocus,
      onCloseAutoFocus,
      ...contentProps
    } = props;
    const context = useDialogContext(__group, __part);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const composedRefs = useComposedRefs(forwardedRef, contentRef);

    // Make sure the whole tree has focus guards as our `Dialog` will be
    // the last element in the DOM (beacuse of the `Portal`)
    useFocusGuards();

    return (
      <>
        <FocusScope
          __group={__group}
          __part={__part}
          asChild
          loop
          trapped={trapFocus}
          onMountAutoFocus={onOpenAutoFocus}
          onUnmountAutoFocus={onCloseAutoFocus}
        >
          <DismissableLayer
            role="dialog"
            id={context.contentId}
            aria-describedby={ariaDescribedBy || context.descriptionId}
            // If `aria-label` is set, ensure `aria-labelledby` is undefined as to avoid confusion.
            // Otherwise fallback to an explicit `aria-labelledby` or the ID used in the
            // `DialogTitle`
            aria-labelledby={ariaLabel ? undefined : ariaLabelledBy || context.titleId}
            aria-label={ariaLabel || undefined}
            data-state={getState(context.open)}
            {...contentProps}
            __group={__group}
            __part={__part}
            ref={composedRefs}
            onDismiss={() => context.onOpenChange(false)}
          />
        </FocusScope>
        {process.env.NODE_ENV === 'development' && <LabelWarning contentRef={contentRef} />}
      </>
    );
  }
);

/* -------------------------------------------------------------------------------------------------
 * DialogTitle
 * -----------------------------------------------------------------------------------------------*/

const TITLE_NAME = 'Title';
const TITLE_DISPLAY_NAME = ROOT_NAME + TITLE_NAME;

type DialogTitleElement = React.ElementRef<typeof Primitive.h2>;
type PrimitiveHeading2Props = Radix.ComponentPropsWithoutRef<typeof Primitive.h2>;
interface DialogTitleProps extends PrimitiveHeading2Props {}

const DialogTitle = React.forwardRef<DialogTitleElement, DialogTitleProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = TITLE_NAME, ...titleProps } = props;
    const context = useDialogContext(__group, __part);
    return (
      <Primitive.h2
        id={context.titleId}
        {...titleProps}
        __group={__group}
        __part={__part}
        ref={forwardedRef}
      />
    );
  }
);

DialogTitle.displayName = TITLE_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogDescription
 * -----------------------------------------------------------------------------------------------*/

const DESCRIPTION_NAME = 'Description';
const DESCRIPTION_DISPLAY_NAME = ROOT_NAME + DESCRIPTION_NAME;

type DialogDescriptionElement = React.ElementRef<typeof Primitive.p>;
type PrimitiveParagraphProps = Radix.ComponentPropsWithoutRef<typeof Primitive.p>;
interface DialogDescriptionProps extends PrimitiveParagraphProps {}

const DialogDescription = React.forwardRef<DialogDescriptionElement, DialogDescriptionProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = DESCRIPTION_NAME, ...descriptionProps } = props;
    const context = useDialogContext(__group, __part);
    return (
      <Primitive.p
        id={context.descriptionId}
        {...descriptionProps}
        __group={__group}
        __part={__part}
        ref={forwardedRef}
      />
    );
  }
);

DialogDescription.displayName = DESCRIPTION_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * DialogClose
 * -----------------------------------------------------------------------------------------------*/

const CLOSE_NAME = 'Close';
const CLOSE_DISPLAY_NAME = ROOT_NAME + CLOSE_NAME;

type DialogCloseElement = React.ElementRef<typeof Primitive.button>;
interface DialogCloseProps extends PrimitiveButtonProps {}

const DialogClose = React.forwardRef<DialogCloseElement, DialogCloseProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = DESCRIPTION_NAME, ...closeProps } = props;
    const context = useDialogContext(__group, __part);
    return (
      <Primitive.button
        type="button"
        {...closeProps}
        __group={__group}
        __part={__part}
        ref={forwardedRef}
        onClick={composeEventHandlers(props.onClick, () => context.onOpenChange(false))}
      />
    );
  }
);

DialogClose.displayName = CLOSE_DISPLAY_NAME;

/* -----------------------------------------------------------------------------------------------*/

function getState(open: boolean) {
  return open ? 'open' : 'closed';
}

const [LabelWarningProvider, useLabelWarningContext] = createContext('DialogLabelWarning', {
  contentName: CONTENT_NAME,
  titleName: TITLE_NAME,
  docsSlug: 'dialog',
});

type LabelWarningProps = {
  __group?: string;
  contentRef: React.RefObject<DialogContentElement>;
};

const LabelWarning: React.FC<LabelWarningProps> = ({ __group = ROOT_NAME, contentRef }) => {
  const labelWarningContext = useLabelWarningContext(__group, 'LabelWarning');

  const MESSAGE = `\`${labelWarningContext.contentName}\` requires a label for the component to be accessible for screen reader users.

You can label the \`${labelWarningContext.contentName}\` by passing a \`${labelWarningContext.titleName}\` component as a child, which also benefits sighted users by adding visible context to the dialog.

Alternatively, you can use your own component as a title by assigning it an \`id\` and passing the same value to the \`aria-labelledby\` prop in \`${labelWarningContext.contentName}\`. If the label is confusing or duplicative for sighted users, you can also pass a label directly by using the \`aria-label\` prop.

For more information, see https://radix-ui.com/primitives/docs/components/${labelWarningContext.docsSlug}`;

  React.useEffect(() => {
    const hasLabel =
      contentRef.current?.getAttribute('aria-label') ||
      document.getElementById(contentRef.current?.getAttribute('aria-labelledby')!);

    if (!hasLabel) console.warn(MESSAGE);
  }, [MESSAGE, contentRef]);

  return null;
};

const Root = Dialog;
const Trigger = DialogTrigger;
const Overlay = DialogOverlay;
const Content = DialogContent;
const Title = DialogTitle;
const Description = DialogDescription;
const Close = DialogClose;

export {
  Dialog,
  DialogTrigger,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
  //
  Root,
  Trigger,
  Overlay,
  Content,
  Title,
  Description,
  Close,
  //
  LabelWarningProvider,
};
export type {
  DialogProps,
  DialogTriggerProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
};

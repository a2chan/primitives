import * as React from 'react';
import { composeEventHandlers } from '@radix-ui/primitive';
import { createContext } from '@radix-ui/react-context';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { useLayoutEffect } from '@radix-ui/react-use-layout-effect';
import { useComposedRefs } from '@radix-ui/react-compose-refs';
import { Primitive } from '@radix-ui/react-primitive';
import { Presence } from '@radix-ui/react-presence';
import { useId } from '@radix-ui/react-id';

import type * as Radix from '@radix-ui/react-primitive';

/* -------------------------------------------------------------------------------------------------
 * Collapsible
 * -----------------------------------------------------------------------------------------------*/

const ROOT_NAME = 'Collapsible';
const ROOT_DISPLAY_NAME = ROOT_NAME;

type CollapsibleContextValue = {
  contentId: string;
  disabled?: boolean;
  open: boolean;
  onOpenToggle(): void;
};

const [CollapsibleProvider, useCollapsibleContext] =
  createContext<CollapsibleContextValue>(ROOT_NAME);

type CollapsibleElement = React.ElementRef<typeof Primitive.div>;
type PrimitiveDivProps = Radix.ComponentPropsWithoutRef<typeof Primitive.div>;
interface CollapsibleProps extends PrimitiveDivProps {
  defaultOpen?: boolean;
  open?: boolean;
  disabled?: boolean;
  onOpenChange?(open?: boolean): void;
}

const Collapsible = React.forwardRef<CollapsibleElement, CollapsibleProps>(
  (props, forwardedRef) => {
    const {
      __group = ROOT_NAME,
      open: openProp,
      defaultOpen,
      disabled,
      onOpenChange,
      ...collapsibleProps
    } = props;

    const [open = false, setOpen] = useControllableState({
      prop: openProp,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    return (
      <CollapsibleProvider
        group={__group}
        disabled={disabled}
        contentId={useId()}
        open={open}
        onOpenToggle={React.useCallback(() => setOpen((prevOpen) => !prevOpen), [setOpen])}
      >
        <Primitive.div
          data-state={getState(open)}
          data-disabled={disabled ? '' : undefined}
          {...collapsibleProps}
          __group={__group}
          ref={forwardedRef}
        />
      </CollapsibleProvider>
    );
  }
);

Collapsible.displayName = ROOT_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * CollapsibleTrigger
 * -----------------------------------------------------------------------------------------------*/

const TRIGGER_NAME = 'Trigger';
const TRIGGER_DISPLAY_NAME = ROOT_NAME + TRIGGER_NAME;

type CollapsibleTriggerElement = React.ElementRef<typeof Primitive.button>;
type PrimitiveButtonProps = Radix.ComponentPropsWithoutRef<typeof Primitive.button>;
interface CollapsibleTriggerProps extends PrimitiveButtonProps {}

const CollapsibleTrigger = React.forwardRef<CollapsibleTriggerElement, CollapsibleTriggerProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = TRIGGER_NAME, ...triggerProps } = props;
    const context = useCollapsibleContext(__group, __part);
    return (
      <Primitive.button
        aria-controls={context.contentId}
        aria-expanded={context.open || false}
        data-state={getState(context.open)}
        data-disabled={context.disabled ? '' : undefined}
        disabled={context.disabled}
        {...triggerProps}
        __group={__group}
        __part={__part}
        ref={forwardedRef}
        onClick={composeEventHandlers(props.onClick, context.onOpenToggle)}
      />
    );
  }
);

CollapsibleTrigger.displayName = TRIGGER_DISPLAY_NAME;

/* -------------------------------------------------------------------------------------------------
 * CollapsibleContent
 * -----------------------------------------------------------------------------------------------*/

const CONTENT_NAME = 'Content';
const CONTENT_DISPLAY_NAME = ROOT_NAME + CONTENT_NAME;

type CollapsibleContentElement = CollapsibleContentImplElement;
interface CollapsibleContentProps extends Omit<CollapsibleContentImplProps, 'present'> {
  /**
   * Used to force mounting when more control is needed. Useful when
   * controlling animation with React animation libraries.
   */
  forceMount?: true;
}

const CollapsibleContent = React.forwardRef<CollapsibleContentElement, CollapsibleContentProps>(
  (props, forwardedRef) => {
    const { __group = ROOT_NAME, __part = CONTENT_NAME, forceMount, ...contentProps } = props;
    const context = useCollapsibleContext(__group, __part);
    return (
      <Presence present={forceMount || context.open}>
        {({ present }) => (
          <CollapsibleContentImpl
            {...contentProps}
            __group={__group}
            __part={__part}
            ref={forwardedRef}
            present={present}
          />
        )}
      </Presence>
    );
  }
);

CollapsibleContent.displayName = CONTENT_DISPLAY_NAME;

/* -----------------------------------------------------------------------------------------------*/

type CollapsibleContentImplElement = React.ElementRef<typeof Primitive.div>;
interface CollapsibleContentImplProps extends PrimitiveDivProps {
  present: boolean;
}

const CollapsibleContentImpl = React.forwardRef<
  CollapsibleContentImplElement,
  CollapsibleContentImplProps
>((props, forwardedRef) => {
  const { __group = ROOT_NAME, __part = CONTENT_NAME, present, children, ...contentProps } = props;
  const context = useCollapsibleContext(__group, __part);
  const [isPresent, setIsPresent] = React.useState(present);
  const ref = React.useRef<CollapsibleContentImplElement>(null);
  const composedRefs = useComposedRefs(forwardedRef, ref);
  const heightRef = React.useRef<number | undefined>(0);
  const height = heightRef.current;
  // when opening we want it to immediately open to retrieve dimensions
  // when closing we delay `present` to retreive dimensions before closing
  const isOpen = context.open || isPresent;

  useLayoutEffect(() => {
    const node = ref.current;
    if (node) {
      const originalTransition = node.style.transition;
      const originalAnimation = node.style.animation;
      // block any animations/transitions so the element renders at its full dimensions
      node.style.transition = 'none';
      node.style.animation = 'none';

      // set height to height from full dimensions
      const rect = node.getBoundingClientRect();
      heightRef.current = rect.height;

      // kick off any animations/transitions that were originally set up
      node.style.transition = originalTransition;
      node.style.animation = originalAnimation;
      setIsPresent(present);
    }
    /**
     * depends on `context.open` because it will change to `false`
     * when a close is triggered but `present` will be `false` on
     * animation end (so when close finishes). This allows us to
     * retrieve the dimensions *before* closing.
     */
  }, [context.open, present]);

  return (
    <Primitive.div
      data-state={getState(context.open)}
      data-disabled={context.disabled ? '' : undefined}
      id={context.contentId}
      hidden={!isOpen}
      {...contentProps}
      __group={__group}
      __part={__part}
      ref={composedRefs}
      style={{
        [`--radix-collapsible-content-height` as any]: height ? `${height}px` : undefined,
        ...props.style,
      }}
    >
      {isOpen && children}
    </Primitive.div>
  );
});

/* -----------------------------------------------------------------------------------------------*/

function getState(open?: boolean) {
  return open ? 'open' : 'closed';
}

const Root = Collapsible;
const Trigger = CollapsibleTrigger;
const Content = CollapsibleContent;

export {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
  //
  Root,
  Trigger,
  Content,
};
export type { CollapsibleProps, CollapsibleTriggerProps, CollapsibleContentProps };

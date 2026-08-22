import { animated, useSpring } from "@react-spring/web";
import { useCallback, useEffect, useRef, useState } from "react";
import { useEvent, useMount } from "react-use";

import { Button } from "../_ui/button";

export interface ToggleOption {
  label: string;
  value: string;
}

interface AnimatedToggleProps {
  defaultValue?: string;
  options: [ToggleOption, ...ToggleOption[]];
  onChange: (selectedItem: string) => void;
}

export function AnimatedToggle({
  options,
  defaultValue = options[0].value,
  onChange,
}: AnimatedToggleProps) {
  const [activeValue, setActiveValue] = useState(defaultValue);

  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth =
    containerRef.current?.getBoundingClientRect().width ?? 0;

  const elements = useRef<Map<string, HTMLDivElement>>(new Map());

  const [styles, api] = useSpring(() => ({
    config: { tension: 300, friction: 30, damping: 0.6 },
    offsetX: 0,
    width: 0,
  }));

  useEffect(() => {
    const valueSet = new Set(options.map((option) => option.value));

    if (valueSet.size !== options.length) {
      throw new Error(
        "AnimatedToggle: Duplicate option values are not allowed.",
      );
    }
  }, [options]);

  const updatePosition = useCallback(
    (value: string, immediate = false) => {
      if (!value || elements.current.size === 0) {
        return;
      }

      const index = options.findIndex(
        ({ value: optionValue }: ToggleOption) => optionValue === value,
      );

      if (index === -1) {
        return;
      }

      const el = elements.current.get(value);

      if (!el) {
        return;
      }

      const containerRect = containerRef.current?.getBoundingClientRect();
      const itemRect = el.getBoundingClientRect();

      const leftOffset = itemRect.left - (containerRect?.left ?? 0);

      void api.start({
        width: itemRect.width,
        offsetX: leftOffset,
        immediate,
      });
    },
    [options, api],
  );

  const handleResize = () => {
    updatePosition(activeValue);
  };

  useMount(() => {
    updatePosition(activeValue, true);
  });

  useEvent("resize", handleResize);

  useEffect(() => {
    updatePosition(activeValue);
  }, [activeValue, updatePosition]);

  function handleChange(value: string) {
    setActiveValue(value);
    onChange(value);
  }

  return (
    <div
      className="relative flex w-fit items-center gap-1 rounded-xl border border-white/10 bg-black/20 p-1 shadow-inner backdrop-blur-md"
      ref={containerRef}
    >
      {/* Layer 1: Inactive State (Base Layer) & Layout Driver */}
      {options.map((option) => (
        <div
          key={option.value}
          className="relative z-0 flex flex-1 items-center justify-center"
          ref={(el) => {
            if (el) {
              elements.current.set(option.value, el);
            }
          }}
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-7 w-full rounded-lg px-4 text-xs font-bold transition-colors hover:bg-transparent"
            onClick={() => {
              handleChange(option.value);
            }}
          >
            {option.label}
          </Button>
        </div>
      ))}

      {/* Layer 2: Active State (Masked Overlay) */}
      {/* The pill acts as a window into the "Active" world */}
      <animated.div
        className="bg-primary pointer-events-none absolute top-1 bottom-1 left-0 z-10 overflow-hidden rounded-lg shadow-lg"
        style={{
          transform: styles.offsetX.to(
            (offsetX) => `translateX(${offsetX.toString()}px)`,
          ),
          width: styles.width,
        }}
      >
        {/* Inner Container: Inverse translation to keep text static relative to parent */}
        <animated.div
          className="absolute top-0 left-0 flex h-full items-center gap-1"
          aria-hidden="true"
          style={{
            transform: styles.offsetX.to(
              (offsetX) => `translateX(${(-offsetX).toString()}px)`,
            ),
            width: `${containerWidth.toString()}px`,
            padding: "4px",
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              className="flex flex-1 items-center justify-center"
            >
              <Button
                variant="ghost"
                size="sm"
                tabIndex={-1}
                className="text-primary-foreground hover:text-primary-foreground h-7 w-full rounded-lg px-4 text-xs font-bold hover:bg-transparent"
              >
                {option.label}
              </Button>
            </div>
          ))}
        </animated.div>
      </animated.div>
    </div>
  );
}

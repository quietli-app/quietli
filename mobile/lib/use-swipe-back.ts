import { useMemo } from "react";
import { Dimensions, PanResponder } from "react-native";

type RouterLike = {
  back: () => void;
};

export function useSwipeBack(router: RouterLike) {
  return useMemo(() => {
    return PanResponder.create({
      onMoveShouldSetPanResponder: (event, gestureState) => {
        const screenWidth = Dimensions.get("window").width;

        const startedOnLeftHalf =
          event.nativeEvent.pageX <= screenWidth * 0.55;

        const movingRight = gestureState.dx > 18;

        const mostlyHorizontal =
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.35;

        return startedOnLeftHalf && movingRight && mostlyHorizontal;
      },

      onPanResponderRelease: (_event, gestureState) => {
        const swipedRightEnough = gestureState.dx > 80;
        const notTooVertical = Math.abs(gestureState.dy) < 80;

        if (swipedRightEnough && notTooVertical) {
          router.back();
        }
      },
    }).panHandlers;
  }, [router]);
}
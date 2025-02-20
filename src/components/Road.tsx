interface RoadProps {
  horizontal?: boolean;
}

export function Road({ horizontal }: RoadProps) {
  const baseStyles = {
    backgroundColor: "#808080",
    position: "absolute" as const,
    zIndex: 1,
  };

  const horizontalStyles = {
    ...baseStyles,
    width: "100vw",
    height: "120px",
    left: 0,
    top: "50%",
    transform: "translateY(-50%)",
  };

  const verticalStyles = {
    ...baseStyles,
    width: "120px",
    height: "100vh",
    left: "50%",
    top: 0,
    transform: "translateX(-50%)",
  };

  return (
    <>
      <div style={horizontal ? horizontalStyles : verticalStyles} />
      <div
        style={{
          position: "absolute",
          top: horizontal ? "50%" : 0,
          left: horizontal ? "-100vw" : "50%",
          width: horizontal ? "200vw" : 0,
          height: horizontal ? 0 : "100vh",
          borderStyle: "dashed",
          borderColor: "white",
          borderWidth: horizontal ? "2px 0 0 0" : "0 2px 0 0",
          zIndex: 2,
        }}
      />
    </>
  );
}

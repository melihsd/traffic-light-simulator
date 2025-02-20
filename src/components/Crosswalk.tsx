import styled from "@emotion/styled";

const CrosswalkContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
`;

const Stripe = styled.div`
  background-color: white;
  width: 90%;
  height: 15px;
  margin: 5px 0;
`;

export function Crosswalk() {
  return (
    <CrosswalkContainer>
      <Stripe />
      <Stripe />
      <Stripe />
      <Stripe />
      <Stripe />
      <Stripe />
    </CrosswalkContainer>
  );
}

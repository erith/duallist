import "./App.css";
import DualList, { type Item } from "./dualist";

function App() {
  const items: Item[] = [
    { groupId: "과일", floorId: "포도" },
    { groupId: "과일", floorId: "사과" },
    { groupId: "과일", floorId: "파인애플" },
    { groupId: "과일", floorId: "바나나" },
    { groupId: "과일", floorId: "딸기" },
    { groupId: "채소", floorId: "토마토" },
    { groupId: "채소", floorId: "배추" },
    { groupId: "채소", floorId: "미나리" },
    { groupId: "채소", floorId: "당근" },
  ];

  const checkedItems = ["과일:포도", "채소:토마토", "과일:바나나"];

  return (
    <DualList
      DefaultValues={items}
      CheckedItems={checkedItems}
      OnCheckedItemsChange={(allCheckedItems, changedItems) => {
        console.log("all checked items", allCheckedItems);
        console.log("changed items", changedItems);
      }}
    />
  );
}

export default App;

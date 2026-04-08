import { useMemo, useRef, useState } from "react";
import _ from "underscore";

export type Item = {
    groupId: string;
    floorId: string;
};

type Props = {
    DefaultValues: Item[];
    CheckedItems: string[];
    OnCheckedItemsChange?: (
        allCheckedItems: Item[],
        changedItems: Item[],
    ) => void;
};

type Checkable = {
    checked: boolean;
};

type CheckableItem = Item & Checkable;

const itemKey = ({ groupId, floorId }: Item) => `${groupId}:${floorId}`;

export const DualList = ({
    DefaultValues,
    CheckedItems,
    OnCheckedItemsChange,
}: Props) => {
    const [items, setItems] = useState<CheckableItem[]>(() =>
        DefaultValues.map((item) => ({
            ...item,
            checked:
                CheckedItems.includes(item.floorId) ||
                CheckedItems.includes(itemKey(item)),
        })),
    );
    const groupCounts = _.reduce(
        items,
        (memo, item) => {
            if (!memo[item.groupId]) {
                memo[item.groupId] = { total: 0, checked: 0 };
            }

            memo[item.groupId].total += 1;
            if (item.checked) {
                memo[item.groupId].checked += 1;
            }

            return memo;
        },
        {} as Record<string, { total: number; checked: number }>,
    );
    const [groupKey, setGroupKey] = useState(items[0]?.groupId ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const draggedKeysRef = useRef<Set<string>>(new Set());
    const dragCheckedStateRef = useRef<boolean | null>(null);

    const groupItems = useMemo(
        () => _.where(items, { groupId: groupKey ?? "" }),
        [groupKey, items],
    );
    const isAllGroupItemsChecked =
        groupItems.length > 0 && groupItems.every((item) => item.checked);

    const emitCheckedItemsChange = (nextItems: CheckableItem[], changedItems: Item[]) => {
        if (changedItems.length === 0) {
            return;
        }

        OnCheckedItemsChange?.(
            nextItems
                .filter((item) => item.checked)
                .map(({ groupId, floorId }) => ({ groupId, floorId })),
            changedItems,
        );
    };

    const setItemChecked = (targetKey: string, checked: boolean) => {
        setItems((currentItems) => {
            let changedItems: Item[] = [];

            const nextItems = currentItems.map((item) => {
                if (itemKey(item) !== targetKey || item.checked === checked) {
                    return item;
                }

                changedItems = [{ groupId: item.groupId, floorId: item.floorId }];
                return { ...item, checked };
            });

            emitCheckedItemsChange(nextItems, changedItems);
            return nextItems;
        });
    };

    const setGroupItemsChecked = (targetGroupKey: string, checked: boolean) => {
        setItems((currentItems) => {
            const changedItems: Item[] = [];

            const nextItems = currentItems.map((item) => {
                if (item.groupId !== targetGroupKey || item.checked === checked) {
                    return item;
                }

                changedItems.push({ groupId: item.groupId, floorId: item.floorId });
                return { ...item, checked };
            });

            emitCheckedItemsChange(nextItems, changedItems);
            return nextItems;
        });
    };

    const toggleAllGroupItems = () => {
        if (!groupKey) {
            return;
        }

        setGroupItemsChecked(groupKey, !isAllGroupItemsChecked);
    };

    const beginToggle = (targetKey: string) => {
        const targetItem = items.find((item) => itemKey(item) === targetKey);
        const nextChecked = !(targetItem?.checked ?? false);

        draggedKeysRef.current = new Set([targetKey]);
        dragCheckedStateRef.current = nextChecked;
        setIsDragging(true);
        setItemChecked(targetKey, nextChecked);
    };

    const dragToggle = (targetKey: string) => {
        if (
            !isDragging ||
            draggedKeysRef.current.has(targetKey) ||
            dragCheckedStateRef.current === null
        ) {
            return;
        }

        draggedKeysRef.current.add(targetKey);
        setItemChecked(targetKey, dragCheckedStateRef.current);
    };

    const endToggle = () => {
        draggedKeysRef.current.clear();
        dragCheckedStateRef.current = null;
        setIsDragging(false);
    };

    return (
        <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
            <div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {_.map(groupCounts, (count, key) => (
                        <li
                            key={key}
                            style={{
                                cursor: "pointer",
                                backgroundColor: groupKey === key ? "orange" : "transparent",
                                padding: "8px 12px",
                                borderRadius: 8,
                            }}
                            onClick={() => {
                                setGroupKey(key);
                                if (!items.some((item) => item.groupId === key && item.checked)) {
                                    setGroupItemsChecked(key, true);
                                }
                            }}
                        >
                            {key} ({count.checked})
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <button
                    type="button"
                    onClick={toggleAllGroupItems}
                    disabled={groupItems.length === 0}
                >
                    {isAllGroupItemsChecked ? "전체 해제" : "전체 선택"}
                </button>
                <ul
                    style={{ listStyle: "none", padding: 0, margin: 0, minWidth: 220 }}
                    onPointerLeave={endToggle}
                >
                    {groupItems.map((item) => {
                        const targetKey = itemKey(item);

                        return (
                            <li
                                key={targetKey}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    cursor: "pointer",
                                    userSelect: "none",
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    backgroundColor: item.checked ? "#e8f3ff" : "transparent",
                                }}
                                onPointerDown={() => beginToggle(targetKey)}
                                onPointerEnter={() => dragToggle(targetKey)}
                                onPointerUp={endToggle}
                            >
                                <input
                                    type="checkbox"
                                    checked={item.checked}
                                    readOnly
                                    style={{ pointerEvents: "none" }}
                                />
                                <span>{item.floorId}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};

export default DualList;

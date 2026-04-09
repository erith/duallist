import { useEffect, useMemo, useRef, useState } from "react";
import _ from "lodash";

export type Item = {
    groupId: string;
    floorId: string;
};

export type Checkable = {
    checked: boolean;
};

export type CheckableItem = Item & Checkable;

type Props = {
    rvLineList: Item[];
    DefaultValues: CheckableItem[];
    OnCheckedItemsChange?: (
        allCheckedItems: CheckableItem[],
        changedItems: CheckableItem[],
    ) => void;
};

const itemKey = ({ groupId, floorId }: Item) => `${groupId}:${floorId}`;

const normalizeCheckedItems = (
    rvLineList: Item[],
    defaultValues: CheckableItem[],
): CheckableItem[] => {
    const rvLineMap = new Map(rvLineList.map((item) => [itemKey(item), item]));

    return defaultValues.reduce<CheckableItem[]>((memo, item) => {
        if (!item.checked) {
            return memo;
        }

        const matchedItem = rvLineMap.get(itemKey(item));
        if (!matchedItem) {
            return memo;
        }

        memo.push({ ...matchedItem, checked: true });
        return memo;
    }, []);
};

export const DualList = ({
    rvLineList,
    DefaultValues,
    OnCheckedItemsChange,
}: Props) => {
    const [checkedItems, setCheckedItems] = useState<CheckableItem[]>(() =>
        normalizeCheckedItems(rvLineList, DefaultValues),
    );
    const [groupKey, setGroupKey] = useState<string | null>(rvLineList[0]?.groupId ?? null);
    const [isDragging, setIsDragging] = useState(false);
    const draggedKeysRef = useRef<Set<string>>(new Set());
    const dragCheckedStateRef = useRef<boolean | null>(null);

    useEffect(() => {
        setCheckedItems(normalizeCheckedItems(rvLineList, DefaultValues));
    }, [rvLineList, DefaultValues]);

    useEffect(() => {
        if (rvLineList.length === 0) {
            setGroupKey(null);
            return;
        }

        const hasCurrentGroup = rvLineList.some((item) => item.groupId === groupKey);
        if (!hasCurrentGroup) {
            setGroupKey(rvLineList[0].groupId);
        }
    }, [groupKey, rvLineList]);

    const checkedItemKeys = useMemo(
        () => new Set(checkedItems.filter((item) => item.checked).map((item) => itemKey(item))),
        [checkedItems],
    );

    const items = useMemo(
        () =>
            rvLineList.map((item) => ({
                ...item,
                checked: checkedItemKeys.has(itemKey(item)),
            })),
        [checkedItemKeys, rvLineList],
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

    const groupItems = useMemo(
        () => _.filter(items, (item: CheckableItem) => item.groupId === (groupKey ?? "")),
        [groupKey, items],
    );

    const isAllGroupItemsChecked =
        groupItems.length > 0 && groupItems.every((item: CheckableItem) => item.checked);

    const emitCheckedItemsChange = (nextCheckedItems: CheckableItem[], changedItems: CheckableItem[]) => {
        if (changedItems.length === 0) {
            return;
        }

        OnCheckedItemsChange?.(nextCheckedItems, changedItems);
    };

    const setItemChecked = (targetKey: string, checked: boolean) => {
        const targetItem = rvLineList.find((item) => itemKey(item) === targetKey);
        if (!targetItem) {
            return;
        }

        setCheckedItems((currentCheckedItems) => {
            const nextCheckedItems = checked
                ? _.uniqBy(
                    [...currentCheckedItems, { ...targetItem, checked: true }],
                    (item) => itemKey(item),
                )
                : currentCheckedItems.filter((item) => itemKey(item) !== targetKey);

            const changedItems = [{ ...targetItem, checked }];
            emitCheckedItemsChange(nextCheckedItems, changedItems);
            return nextCheckedItems;
        });
    };

    const setGroupItemsChecked = (targetGroupKey: string, checked: boolean) => {
        const targetItems = rvLineList.filter((item) => item.groupId === targetGroupKey);
        if (targetItems.length === 0) {
            return;
        }

        setCheckedItems((currentCheckedItems) => {
            const currentCheckedKeys = new Set(currentCheckedItems.map((item) => itemKey(item)));
            const changedItems = targetItems
                .filter((item) => currentCheckedKeys.has(itemKey(item)) !== checked)
                .map((item) => ({ ...item, checked }));

            if (changedItems.length === 0) {
                return currentCheckedItems;
            }

            const nextCheckedItems = checked
                ? _.uniqBy(
                    [
                        ...currentCheckedItems,
                        ...targetItems.map((item) => ({ ...item, checked: true })),
                    ],
                    (item) => itemKey(item),
                )
                : currentCheckedItems.filter((item) => item.groupId !== targetGroupKey);

            emitCheckedItemsChange(nextCheckedItems, changedItems);
            return nextCheckedItems;
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
                    {groupItems.map((item: CheckableItem) => {
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

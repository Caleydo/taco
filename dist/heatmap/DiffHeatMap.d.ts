/**
 * Created by Christina Niederer on 12.01.2017.
 */
import 'jquery-ui/ui/widgets/slider';
import 'jquery-ui/themes/base/all.css';
export interface IDiffRow {
    id: string;
    pos: number;
}
export interface IDiffData {
    /**
     * Information about the union table
     */
    union: {
        c_ids: number[];
        r_ids: number[];
        uc_ids: string[];
        ur_ids: string[];
    };
    /**
     * Structural changes
     */
    structure: {
        added_rows: IDiffRow[];
        added_cols: IDiffRow[];
        deleted_rows: IDiffRow[];
        deleted_cols: IDiffRow[];
    };
    /**
     * Content Changes
     */
    content: {
        cpos: number;
        rpos: number;
        row: string;
        col: string;
        diff_data: number;
    }[];
    /**
     * Reorder changes
     */
    reorder: {
        rows: IDiffReorderChange[];
        cols: IDiffReorderChange[];
    };
    /**
     * Merge changes
     * Not further used or specified
     */
    merge: {
        merged_cols: any[];
        merged_rows: any[];
        split_cols: any[];
        split_rows: any[];
    };
}
export interface IDiffReorderChange {
    to: number;
    from: number;
    id: string;
    diff: number;
}

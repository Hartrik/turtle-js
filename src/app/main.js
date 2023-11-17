import {DevEditorBuilder} from "./DevEditorBuilder";
import {EditorBuilder} from "./EditorBuilder";
import {GalleryBuilder} from "./GalleryBuilder";

export function devEditorBuilder() {
    return new DevEditorBuilder();
}

export function editorBuilder() {
    return new EditorBuilder();
}

export function galleryBuilder() {
    return new GalleryBuilder();
}

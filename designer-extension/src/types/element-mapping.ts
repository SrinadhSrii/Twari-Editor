export interface ElementMapping {
    id: string;
    type: string;
    styles: StyleMapping[];
    attributes: { [key: string]: any } | null;
    children: ElementMapping[] | null;
    settings?: ElementSettings | null;
  }
  
  export interface StyleMapping {
    id: string;
    name: string;
    properties: {
      [breakpoint: string]: {
        [pseudo: string]: PropertyMap;
      };
    };
  }
  
export interface ElementSettings {
    // Element-specific settings (will vary by element type)
    linkSettings?: {
      href?: string;
      target?: string;
    };
    imageSettings?: {
      src?: string;
      alt?: string;
    }
  };
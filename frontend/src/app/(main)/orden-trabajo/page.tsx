// Archivo: frontend/src/app/(main)/obras/orden-trabajo/page.tsx (REEMPLAZO TOTAL Y CORREGIDO)

"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Pencil, Trash2, Upload } from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------
// 🚀 MAPA GLOBAL COMPLETO: Tipo → Carpeta → { actividades: { Actividad: { N2_opciones: [] } } }
// ---------------------------------------------------------------------

const WORK_VALIDATION_MAP: {
  [tipo: string]: {
    [carpeta: string]: {
      activities: {
        [actividad: string]: { N2_opciones: string[] };
      };
    };
  };
} = {
  CAISSON: {
    PRELIMINARES: {
      activities: {
        "Se valido el diseño definitivo de cimentación profunda y el cruce definitivo de planos estructurales con planos arquitectónicos y de instalaciones": {
          N2_opciones: [
            "El espacio arquitectónico se afecta con la ubicación de los elementos de cimentación",
            "Hay una modificación en el diseño que afecta la cimentación de la edificación",
            "Otra (agregar en observación)",
          ],
        },
        "Se valido niveles de desplante del elemento respecto a la información establecida en el estudio de suelos y sus recomendaciones": {
          N2_opciones: [
            "Otra (agregar en observación)",
            "Se requiere modificar niveles de desplante",
          ],
        },
      },
    },
    TRAZADO_DE_EJES_ESTRUCTURALES: {
      activities: {
        "Se validó el replanteo del elemento en la obra Dicha actividad será validada y aprobada por el residente técnico y el maestro de obra ( si se trata del nivel en el foso del ascensor se debe validar el sobre recorrido negativo del foso)": {
          N2_opciones: [
            "Hay modificación en el cambio de los ejes de caisson por parte del diseñador",
            "No coincide las medidas de plano con las medidas en obra",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    EXCAVACION: {
      activities: {
        "Se validó la exactitud en la dimensión del la excavación del Caisson (diámetro y profundidad)": {
          N2_opciones: [
            "No coincide la dimensión en la excavación del diámetro del Caisson",
            "No coincide la excavación con nivel de desplante",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la dimensión requerida en la excavación de la campana se recomienda dejar en observaciones la dimensión de la campana": {
          N2_opciones: [
            "Hay presencia de derrumbe o se derrumbo la excavación de la campana",
            "No coincide la sección y las dimensiones proyectadas de la campana",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    ARMADO_DEL_ACERO: {
      activities: {
        "Se valida que el hincado de la canasta sea según la dimensión proyectada y con las especificaciones del diseño estructural (se recomienda que los ganchos del acero se hagan antes del vaciado del fuste)": {
          N2_opciones: [
            "No cumple con las especificaciones del acero",
            "Otra (agregar en observación)",
            "Se modificó las condiciones del hincado de la canasta",
          ],
        },
        "Se validó que se dejaron expuestas las varillas longitudinales de cada Caisson de acuerdo al mínimo de traslapo": {
          N2_opciones: [
            "No se dejan expuestas las varillas de acuerdo al mínimo de traslapo",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    COLOCACION_DEL_CONCRETO: {
      activities: {
        "Se validó que el concreto utilizado tiene la dosificación indicada (registrar en observaciones el porcentaje de piedra y de concreto a utilizar en el elemento)": {
          N2_opciones: [
            "No se cuenta con la dosificación especificada en los diseños estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se valido que el vaciado del concreto inicie inmediatamente se termine la excavación de la campana y se instale el castillo. Se valida que el vaciado sea continuo": {
          N2_opciones: [
            "No hay condiciones previas para iniciar el vaciado",
            "No se hizo el vaciado inmediatamente después de abrir la excavación de la campana",
            "Otra (agregar en observación)",
            "Se inició el vaciado sin previa autorización del equipo técnico",
          ],
        },
        "Se validó que la descarga del concreto sea tan cerca como sea posible a su posición final (caída máxima permisible 1.20 metros": {
          N2_opciones: [
            "No se cuenta con un tubo para hacer la descarga del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó que el acero de los Caisson haya quedado en la posición requerida y se limpió el acero después del vaciado": {
          N2_opciones: [
            "El acero no quedó en la posición requerida",
            "No se limpió el acero después del vaciado",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el nivel de terminado del concreto después de fundido el elemento y se validó que se retiró la potasa después del vaciado final del Caisson": {
          N2_opciones: [
            "El nivel de terminado no esta de acuerdo con el nivel marcado en planos",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
  },
  VIGA_DE_CIMENTACION: {
    PRELIMINARES: {
      activities: {
        "Se validó la información y se aseguró la concordancia entre los planos estructurales, arquitectónicos y de instalaciones": {
          N2_opciones: [
            "El espacio arquitectónico se afecta con la ubicación de los elementos de cimentación",
            "Hay una modificación de diseño en el transcurso de ejecución de la obra. Se requiere información planimétrica adicional para inicio de actividad",
            "No se cuenta con planos definitivos para iniciar la actividad",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    TRAZADO_DE_EJES_ESTRUCTURALES: {
      activities: {
        "Se validó la matriz de coincidencia entre los diseños estructurales y arquitectónicos con la localización en obra. Este proceso será revisado y aprobado por el residente técnico y el maestro de obra con especial atención a la holgura máxima permitida": {
          N2_opciones: [
            "Hay modificación en el nivel de desplante de la viga de cimentación",
            "No coincide las medidas de plano con las medidas en campo",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    ARMADO_EN_OBRA_EXCAVACION_Y_ACERO: {
      activities: {
        "Se revisó la profundidad de las brechas, los plomos e hilos, de acuerdo al diseño y niveles predeterminados": {
          N2_opciones: [
            "No coincide con el nivel de desplante",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la colocación del solado de limpieza y el espesor del solado": {
          N2_opciones: [
            "El espesor del solado no corresponde a la especificación",
            "No tiene solado de limpieza",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el armado de los elementos horizontales de refuerzo": {
          N2_opciones: [
            "No cumple con la especificación del acero horizontal de refuerzo, con la cantidad de varillas o con la distribución de los elementos de acuerdo a lo señalado en los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validan los traslapos del elemento para vigas (varilla No 2 - ¼ Ld 550mm, varilla No 3-3/8 Ld 600mm, Varilla No 4- ½ Ld 700mm, Varilla No 5-5/8 Ld 800mm, Varilla No 6-3/4 Ld 850mm, Varilla No 7-7/8 Ld 1250mm, Varilla No8 -1 pulgada Ld 1300mm.": {
          N2_opciones: [
            "Las varillas de refuerzo no cumplen con la longitud mínima de traslapo",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la especificación de los estribos y/o flejes": {
          N2_opciones: [
            "No cumple con la especificación señalada en los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se verificó que el acero de la viga de cimentación esté adecuadamente apoyado sobre panelas de concreto con la misma resistencia que el elemento de concreto a intervenir, cumpliendo con los recubrimientos mínimos requeridos.": {
          N2_opciones: [
            "No cuenta con panelas (no se permite avanzar con la colocación del concreto)",
            "Otra (agregar en observación)",
            "Se instalan panelas de material que no corresponde a la especificación",
          ],
        },
        "Se validó que el acero de refuerzo y la excavación estén limpios antes del vaciado.": {
          N2_opciones: [
            "No se hace limpieza del elemento , No se permite el vaciado hasta que no se cumpla este requerimiento",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    COLOCACION_DEL_CONCRETO: {
      activities: {
        "Se aprueba el inicio del vaciado al aprobar técnicamente las condicionantes anteriores. Se solicita el concreto de acuerdo al requerimiento del diseño estructural y teniendo en cuenta el uso de aditivos para mejorar permeabilidad, evolución de resistencia, fluidez entre otros.": {
          N2_opciones: [
            "El concreto no cumple con el requerimiento establecido en el diseño estructural",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida la especificación del concreto": {
          N2_opciones: [
            "La especificación del concreto no coincide con los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el uso adecuado del vibrador. Es recomendable contar mínimo con dos vibradores en el sitio de vaciado": {
          N2_opciones: [
            "No cuenta con vibradores en el momento de la colocación del concreto",
            "No se cuenta con mínimo dos vibradores en el sitio de vaciado",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el nivel de terminado del concreto después de fundido el elemento.": {
          N2_opciones: [
            "El nivel de terminado no está de acuerdo con el nivel marcado en planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó que se hizo toma de muestras en cilindros (en observaciones digitar número de cilindro de este elemento) N.S.R 2010. C.5.6.2 Frecuencia de los ensayos. C.5.6.2.1 Las muestras (véase C.5.6.2.4) para los ensayos de resistencia de cada clase de concreto, colocado cada día deben tomarse no menos de una vez al día, ni menos de una vez por cada 40 m3 de concreto, ni menos de una vez por cada 200 m2 de superficie de losas o muros. De igual manera, como mínimo, debe tomarse una muestra por cada 50 tandas de mezclado de cada clase de concreto": {
          N2_opciones: [
            "No se tomaron muestras de cilindros",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
  },
  ZAPATAS: {
    PRELIMINARES: {
      activities: {
        "Se validó la información y se aseguró la concordancia entre los planos estructurales, arquitectónicos y de instalaciones": {
          N2_opciones: [
            "El espacio arquitectónico se afecta con la ubicación de los elementos de cimentación",
            "Hay una modificación de diseño en el transcurso de ejecución de la obra. Se requiere información planimétrica adicional para inicio de actividad",
            "No se cuenta con planos definitivos para iniciar la actividad",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    TRAZADO_DE_EJES_ESTRUCTURALES: {
      activities: {
        "Se validó la matriz de coincidencia entre los diseños estructurales y arquitectónicos con la localización en obra. Este proceso será revisado y aprobado por el residente técnico y el maestro de obra con especial atención a la holgura máxima permitida": {
          N2_opciones: [
            "Hay modificación en el nivel de desplante de la zapata",
            "No coincide las medidas de plano con las medidas en campo",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    ARMADO_EN_OBRA_EXCAVACION_Y_ACERO: {
      activities: {
        "Se revisó la profundidad de las brechas, los plomos e hilos, de acuerdo al diseño y niveles predeterminados": {
          N2_opciones: [
            "No coincide con el nivel de desplante",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la colocación del solado de limpieza y el espesor del solado": {
          N2_opciones: [
            "El espesor del solado no corresponde a la especificación",
            "No tiene solado de limpieza",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el armado de los elementos horizontales de refuerzo": {
          N2_opciones: [
            "No cumple con la especificación del acero horizontal de refuerzo, con la cantidad de varillas o con la distribución de los elementos de acuerdo a lo señalado en los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se verificó que el acero de la viga de cimentación esté adecuadamente apoyado sobre panelas de concreto con la misma resistencia que el elemento de concreto a intervenir, cumpliendo con los recubrimientos mínimos requeridos.": {
          N2_opciones: [
            "No cuenta con panelas (no se permite avanzar con la colocación del concreto)",
            "Otra (agregar en observación)",
            "Se instalan panelas de material que no corresponde a la especificación",
          ],
        },
        "Se validó que el acero de refuerzo y la excavación estén limpios antes del vaciado.": {
          N2_opciones: [
            "No se hace limpieza del elemento , No se permite el vaciado hasta que no se cumpla este requerimiento",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    COLOCACION_DEL_CONCRETO: {
      activities: {
        "Se Validó las condiciones de vaciado en cuanto a equipos de producción y transporte de concreto, personal y clima": {
          N2_opciones: [
            "El contratista no cuenta con el personal mínimo requerido para la colocación del concreto",
            "Las condiciones climáticas no permiten ejecutar el vaciado del concreto",
            "No hay condiciones del equipo de producción de concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se aprueba el inicio del vaciado al aprobar técnicamente las condicionantes anteriores. Se solicita el concreto de acuerdo al requerimiento del diseño estructural y teniendo en cuenta el uso de aditivos para mejorar permeabilidad, evolución de resistencia, fluidez entre otros.": {
          N2_opciones: [
            "El concreto no cumple con el requerimiento establecido en el diseño estructural",
            "No se cuenta con el personal suficiente para hacer la colocación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida la especificación del concreto": {
          N2_opciones: [
            "La especificación del concreto no coincide con los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el curado con agua (48 horas)": {
          N2_opciones: [
            "No se realizan acciones de curado del elemento y se ha ce un requerimiento inmediato",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el nivel de terminado del concreto después de fundido el elemento.": {
          N2_opciones: [
            "El nivel de terminado no está de acuerdo con el nivel marcado en planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el uso adecuado del vibrador y martillo de caucho. Es recomendable contar mínimo con dos vibradores en el sitio de vaciado": {
          N2_opciones: [
            "No hay personal capacitado para usar el vibrador",
            "No se cuenta con mínimo dos vibradores en el sitio de vaciado",
            "No se cuenta con personal para la labor de chipote",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó que se hizo toma de muestras en cilindros (en observaciones digitar número de cilindro de este elemento) N.S.R 2010. C.5.6.2 Frecuencia de los ensayos. C.5.6.2.1 Las muestras (véase C.5.6.2.4) para los ensayos de resistencia de cada clase de concreto, colocado cada día deben tomarse no menos de una vez al día, ni menos de una vez por cada 40 m3 de concreto, ni menos de una vez por cada 200 m2 de superficie de losas o muros. De igual manera, como mínimo, debe tomarse una muestra por cada 50 tandas de mezclado de cada clase de concreto": {
          N2_opciones: [
            "No se tomaron muestras de cilindros",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
  },
  COLUMNAS: {
    PRELIMINARES: {
      activities: {
        "Se validó la información y se aseguró la concordancia entre los planos estructurales, arquitectónicos y de instalaciones": {
          N2_opciones: [
            "Hay un modificación en el diseño y se definió durante la ejecución de la obra",
            "No existen detalles constructivos o falta aclaración de alguno de los elementos",
            "No hay planos estructurales definitivos",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el proceso de aprobación de la formaleta": {
          N2_opciones: [
            "El contratista no ha entregado plano de despiece se define fecha de entrega del plano de despiece",
            "La formaleta no se aprueba por la dirección de obra, se define fecha de cambio de formaleta para validar en obra",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    TRAZADO_DE_EJES_ESTRUCTURALES: {
      activities: {
        "Se validó el replanteo del elemento en la obra. Dicha actividad será validada y aprobada por el residente técnico y el maestro de obra": {
          N2_opciones: [
            "Hay modificación en el nivel de terreno, especificar en la observación el nivel donde no hay coincidencia",
            "No coincide las medidas de plano con las medidas en campo deja en la observación el detalle de la no conformidad",
            "Otra (agregar en observación)",
          ],
        },
        "Se valido el trazado de ejes (cimbrado) a nivel de ejes generales": {
          N2_opciones: [
            "El replanteo no coincide con los ejes generales",
            "Otra (agregar en observación)",
          ],
        },
        "Se verificó el acero de arranque en la sección de la columna a armar, asegurando la revisión piso por piso. No se permitirá ninguna holgura; el acero de arranque debe ubicarse con precisión de acuerdo con las especificaciones detalladas en los planos. No se permitirá el grifado ni el doblez en los elementos verticales. En caso de detectar desviaciones, se deberá anclar una nueva varilla y ajustar su posición conforme a las especificaciones requeridas.": {
          N2_opciones: [
            "El acero no esta en la posición adecuada se sale de la cimbra",
            "El collarín de los flejes iniciales no se armó correctamente",
            "Faltan elementos verticales de refuerzo",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    ARMADO_DE_ACERO: {
      activities: {
        "Se valido el armado de los aceros de refuerzo vertical del elemento": {
          N2_opciones: [
            "No cumple con la especificación señalada en los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validan los traslapos del elemento para vigas (varilla No 2 - ¼ Ld 550mm, varilla No 3-3/8 Ld 600mm, Varilla No 4- ½ Ld 700mm, Varilla No 5-5/8 Ld 800mm, Varilla No 6-3/4 Ld 850mm, Varilla No 7-7/8 Ld 1250mm, Varilla No8 -1 pulgada Ld 1300mm.": {
          N2_opciones: [
            "No cumple con el traslapos establecidos según la norma",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida que los estribos y los ganchos de doblez cumplan con las especificaciones detalladas en los planos estructurales. Se recomienda que los ganchos de cada estribo se traslapen de acuerdo con la ubicación de cada estribo": {
          N2_opciones: [
            "El gancho de doblez no coincide con lo establecido en los planos estructurales y no se ubican traslapados",
            "No cumple con la cantidad de estribos señalados en el plano estructural",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó que los aceros están sobre el área de vaciado y armado del elemento, igualmente tendrán un recubrimiento mínimo de 2cm en cada una de sus caras. Por norma son 4 cm de recubrimiento al estribo. No se autoriza la grifada o dobles de los elementos verticales, si estos se salen de la cimbra piso a piso. Para normalizar el proceso se debe anclar una nueva varilla y normalizar la posición de la misma.": {
          N2_opciones: [
            "Otra (agregar en observación)",
            "Presencia de grifado. No se autoriza la grifada o doblez de los elementos verticales de acero si estos se salen de la cimbra piso a piso; para ello se debe anclar una nueva varilla y normalizar la posición de la misma. Se debe solicitar el diseño del anclaje a realizar y este debe ser ejecutado por personal y productos certificados",
          ],
        },
      },
    },
    FORMALETA: {
      activities: {
        "Se valida formaleta del elemento a nivel de superficie de contacto y accesorios . Se revisa en el elemento plomo y alineamiento. No puede presentar pandeo, abolladuras y la superficie de contacto debe estar libre de residuos de concreto.": {
          N2_opciones: [
            "La superficie de contacto de la formaleta no tiene las condiciones mínimas en plomo,alineaminto , superficie continua (marcar en observaciones si presenta pandeo, abolladuras) o limpieza",
            "No se cuenta con los accesorios mínimos para la formaleta (alineadores, distanciadores, corbatas",
            "Otra (agregar en observación)",
          ],
        },
        "Se revisó el atraque de la formaleta": {
          N2_opciones: [
            "El atraque lateral de la formaleta no es adecuado(reportarlo en observaciones",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    COLOCACION_DEL_CONCRETO: {
      activities: {
        "Se aprueba el inicio del vaciado al aprobar técnicamente las condicionantes anteriores. Se solicita el concreto de acuerdo al requerimiento del diseño estructural y teniendo en cuenta el uso de aditivos para mejorar permeabilidad, evolución de resistencia, fluidez entre otros.": {
          N2_opciones: [
            "El concreto no cumple con el requerimiento establecido en el diseño estructural",
            "No se cuenta con el personal suficiente para hacer la colocación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida la especificación del concreto": {
          N2_opciones: [
            "La especificación del concreto no coincide con los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el uso adecuado del vibrador y martillo de caucho. Es recomendable contar mínimo con dos vibradores en el sitio de vaciado": {
          N2_opciones: [
            "No hay personal capacitado para usar el vibrador",
            "No se cuenta con mínimo dos vibradores en el sitio de vaciado",
            "No se cuenta con personal para la labor de chipote",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el nivel de terminado del concreto después de fundido el elemento.": {
          N2_opciones: [
            "El nivel de terminado no está de acuerdo con el nivel marcado en planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó que se hizo toma de muestras en cilindros (en observaciones digitar número de cilindro de este elemento) N.S.R 2010. C.5.6.2 Frecuencia de los ensayos. C.5.6.2.1 Las muestras (véase C.5.6.2.4) para los ensayos de resistencia de cada clase de concreto, colocado cada día deben tomarse no menos de una vez al día, ni menos de una vez por cada 40 m3 de concreto, ni menos de una vez por cada 200 m2 de superficie de losas o muros. De igual manera, como mínimo, debe tomarse una muestra por cada 50 tandas de mezclado de cada clase de concreto": {
          N2_opciones: [
            "No se tomaron muestras de cilindros",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el curado con agua (48 horas)": {
          N2_opciones: [
            "No se realizan acciones de curado del elemento y se ha ce un requerimiento inmediato",
            "Otra (agregar en observación)",
          ],
        },
        "Se valido que se desencofró la formaleta después de 10 horas de la fundida de los elementos y se hacen los resanes estructurales necesarios en las siguientes 12 horas de la colocación del concreto": {
          N2_opciones: [
            "No se hacen los resanes estructurales o se tardan mas de 12 horas para intervenirlos",
            "Otra (agregar en observación)",
            "Se retira la formaleta antes de 10 horas de la colocación del concreto",
          ],
        },
      },
    },
    DESENCOFRADO_Y_RESANES_ESTRUCTURALES: {
      activities: {
        "Se valido que se desencofró la formaleta después de 10 horas de la fundida de los elementos y se hacen los resanes estructurales necesarios en las siguientes 12 horas de la colocación del concreto": {
          N2_opciones: [
            "No se hacen los resanes estructurales o se tardan mas de 12 horas para intervenirlos",
            "Otra (agregar en observación)",
            "Se retira la formaleta antes de 10 horas de la colocación del concreto",
          ],
        },
      },
    },
  },
  VIGAS_Y_LOSAS_ENTREPISO: {
    PRELIMINARES: {
      activities: {
        "Se validó la información técnica y se aseguró la concordancia entre planos arquitectónicos, estructurales y de instalaciones. Se revisará previamente información respecto a la delimitación de la losa de borde, refuerzos en balcones, vigas perimetrales, ductos , vacíos y foso de ascensor": {
          N2_opciones: [
            "Hay modificación en la especificación del sistema constructivo de la losa de entrepiso",
            "Hay un modificación en el diseño y se definió durante la ejecución de la obra",
            "No existen detalles constructivos o falta aclaración de alguno de los elementos",
            "No hay definición respecto al sistema constructivo de la losa de entrepiso",
            "No se especifica la delimitación de la losa de borde",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el sistema de losa de entrepiso a ejecutar (incluir el tipo de sistema en observaciones )": {
          N2_opciones: [
            "Hay modificación en la especificación del sistema constructivo de la losa de entrepiso",
            "No hay definición respecto al sistema constructivo de la losa de entrepiso",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    TRAZADO_DE_EJES_ESTRUCTURALES: {
      activities: {
        "Se validó la matriz de coincidencia entre los diseños estructurales, arquitectónicos y de instalaciones con la localización en obra, este proceso será revisado y aprobado por el residente técnico y el maestro de obra con especial atención a la holgura máxima permitida (5mm": {
          N2_opciones: [
            "Hay modificación en el nivel de entrepiso especificar nivel",
            "No coincide las medidas de plano con las medidas en campo (dimensión, escuadra o alineamiento) holgura máxima permitida 5mm",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida el nivel de fondeo de la formaleta , revisando los niveles piso a piso": {
          N2_opciones: [
            "El nivel de fondeo no es acorde a los niveles especificados en los planos estructurales y/o arquitectónicos",
            "El nivel de fondeo se modifico por los diseñadores",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    ARMADO_DE_ACERO_E_INSTALACIONES: {
      activities: {
        "Se supervisó y aprobó que la colocación del acero de refuerzo en las vigas de entrepiso coincide con lo detallado en los planos estructurales, garantizando diámetros de varilla horizontal, estribos diámetro y cantidad, traslapos mínimos y figurado del acero": {
          N2_opciones: [
            "No cumple con la especificación del acero horizontal de refuerzo, con la cantidad de varillas o con la distribución de los elementos de acuerdo a lo señalado en los planos estructurales",
            "No cumplen los traslapos o los ganchos de doblez",
            "Otra (agregar en observación)",
          ],
        },
        "Se validan los traslapos del elemento para vigas (varilla No 2 - ¼ Ld 550mm, varilla No 3-3/8 Ld 600mm, Varilla No 4- ½ Ld 700mm, Varilla No 5-5/8 Ld 800mm, Varilla No 6-3/4 Ld 850mm, Varilla No 7-7/8 Ld 1250mm, Varilla No8 -1 pulgada Ld 1300mm.": {
          N2_opciones: [
            "Las varillas de refuerzo no cumplen con la longitud mínima de traslapo",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida la especificación de los estribos y los ganchos de doblez": {
          N2_opciones: [
            "No cumple con la cantidad de estribos señalados en los planos estructurales",
            "No cumple conla especificación de espesor de acuerdo a lo señalado en los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Si el sistema de entrepiso cuenta con prelosas o elementos similares se supervisa y aprueba el izaje e instalación de prelosas la cual debe tener un anclaje de un mínimo de 2.5 cm dentro de la viga de entrepiso, Validando igualmente el numero de hilos de acuerdo al diseño estructural": {
          N2_opciones: [
            "Las prelosas no cuentan con los hilos especificados en el diseño técnico",
            "Las prelosas presentan deflexión requieren ser cambiadas",
            "No se cumple con la longitud mínima de ancleje de la prelosa",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida las viga de amarre en la losa de entrepiso": {
          N2_opciones: [
            "No cumple con la especificación del acero en los elementos horizontales",
            "No cumple con los estribos y ganchos en la viga de amarre",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida el refuerzo inferior y/o el refuerzo superior de la losa de entrepiso, se verifica especificación de la malla, traslapo de la malla entre otros": {
          N2_opciones: [
            "No cumple con la especificación establecida en los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se verificó que el acero de la viga de entrepiso y el acero inferior de la losa de entrepiso esté adecuadamente apoyado sobre panelas de concreto con la misma resistencia que el elemento de concreto a intervenir, cumpliendo con los recubrimientos mínimos requeridos": {
          N2_opciones: [
            "No cuenta con panelas (no se permite avanzar con la colocación del conceto)",
            "Otra (agregar en observación)",
            "Se instalan panelas de material que no corresponde a la especificación",
          ],
        },
        "Se validó la disposición de todas las instalaciones hidráulicas y sanitarias en los elementos de los muros. Se Verificó que el diámetro del tubo no exceda 1/3 del espesor del muro, conforme a la norma NSR-10, Título C.": {
          N2_opciones: [
            "Las instalaciones no cumplen con la disposición del trazado sobre los muros (en observaciones identificar el tipo de red: que no aplica con la especificación)",
            "No se cumple con el distanciamiento mínimo entre tuberías para evitar segregación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la disposición de todas las instalaciones eléctricas y de comunicaciones en los elementos de los muros. Se Verificó que el diámetro del tubo no exceda 1/3 del espesor del muro, conforme a la norma NSR-10, Título C.": {
          N2_opciones: [
            "Las instalaciones no cumplen con la disposición del trazado sobre los muros (en observaciones identificar el tipo de red: que no aplica con la especificación)",
            "No se cumple con el distanciamiento mínimo entre tuberías para evitar segregación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la disposición de todas las instalaciones de gas en los elementos de los muros. Se Verificó que el diámetro del tubo no exceda 1/3 del espesor del muro, conforme a la norma NSR-10, Título C.": {
          N2_opciones: [
            "Las instalaciones no cumplen con la disposición del trazado sobre los muros (en observaciones identificar el tipo de red: que no aplica con la especificación)",
            "No se cumple con el distanciamiento mínimo entre tuberías para evitar segregación del concreto",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    FORMALETA: {
      activities: {
        "Se validó que el acero de refuerzo y la zona de vaciado, estén limpios antes del vaciado.": {
          N2_opciones: [
            "No se hace limpieza del elemento. No se permite el vaciado hasta que no se cumpla este requerimiento",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida plomos en la formaleta lateral de vigas": {
          N2_opciones: [
            "No hay plomo en la formaleta de vigas",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la ubicación y distribución de retaqueo de losas (como mínimo la losa inmediatamente anterior debe tener tacos para retaqueo)": {
          N2_opciones: [
            "No hay retaqueo de la losa inmediatamente anterior, NO se permite el vaciado hasta que no se cumpla con este requerimiento.",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    COLOCACION_DEL_CONCRETO: {
      activities: {
        "Se aprueba el inicio del vaciado al aprobar técnicamente las condicionantes anteriores. Se solicita el concreto de acuerdo al requerimiento del diseño estructural y teniendo en cuenta el uso de aditivos para mejorar permeabilidad, evolución de resistencia, fluidez entre otros.": {
          N2_opciones: [
            "El concreto no cumple con el requerimiento establecido en el diseño estructural",
            "No se cuenta con el personal suficiente para hacer la colocación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida la especificación del concreto": {
          N2_opciones: [
            "La especificación del concreto no coincide con los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se Validó las condiciones de vaciado en cuanto a equipos de producción y transporte de concreto, personal y clima": {
          N2_opciones: [
            "El contratista no cuenta con el personal mínimo requerido para la colocación del concreto",
            "Las condiciones climáticas no permiten ejecutar el vaciado del concreto",
            "No hay condiciones del equipo de producción de concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el uso adecuado del vibrador y martillo de caucho. Es recomendable contar mínimo con dos vibradores en el sitio de vaciado": {
          N2_opciones: [
            "No hay personal capacitado para usar el vibrador",
            "No se cuenta con mínimo dos vibradores en el sitio de vaciado",
            "No se cuenta con personal para la labor de chipote",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el nivel de terminado del concreto después de fundido el elemento.": {
          N2_opciones: [
            "El nivel de terminado no está de acuerdo con el nivel marcado en planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó que se hizo toma de muestras en cilindros (en observaciones digitar número de cilindro de este elemento) N.S.R 2010. C.5.6.2 Frecuencia de los ensayos. C.5.6.2.1 Las muestras (véase C.5.6.2.4) para los ensayos de resistencia de cada clase de concreto, colocado cada día deben tomarse no menos de una vez al día, ni menos de una vez por cada 40 m3 de concreto, ni menos de una vez por cada 200 m2 de superficie de losas o muros. De igual manera, como mínimo, debe tomarse una muestra por cada 50 tandas de mezclado de cada clase de concreto": {
          N2_opciones: [
            "No se tomaron muestras de cilindros",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el curado con agua (48 horas)": {
          N2_opciones: [
            "No se realizan acciones de curado del elemento y se ha ce un requerimiento inmediato",
            "Otra (agregar en observación)",
          ],
        },
        "Se valido que se desencofró la formaleta después de 10 horas de la fundida de los elementos y se hacen los resanes estructurales necesarios en las siguientes 12 horas de la colocación del concreto": {
          N2_opciones: [
            "No se hacen los resanes estructurales o se tardan mas de 12 horas para intervenirlos",
            "Otra (agregar en observación)",
            "Se retira la formaleta antes de 10 horas de la colocación del concreto",
          ],
        },
      },
    },
    DESENCOFRADO_Y_RESANES_ESTRUCTURALES: {
      activities: {
        "Se valido que se desencofró la formaleta después de 10 horas de la fundida de los elementos y se hacen los resanes estructurales necesarios en las siguientes 12 horas de la colocación del concreto": {
          N2_opciones: [
            "No se hacen los resanes estructurales o se tardan mas de 12 horas para intervenirlos",
            "Otra (agregar en observación)",
            "Se retira la formaleta antes de 10 horas de la colocación del concreto",
          ],
        },
      },
    },
  },
  MURO_EN_BLOQUE: {
    PRELIMINARES: {
      activities: {
        "Se validó la información y se aseguró la concordancia entre los planos estructurales, arquitectónicos y de instalaciones": {
          N2_opciones: [
            "Hay un modificación en el diseño y se definió durante la ejecución de la obra",
            "No existen detalles constructivos o falta aclaración de alguno de los elementos",
            "No hay coincidencia con los planos de diseño (instalaciones eléctricos, hidráulicos, sanitarios, gas, otros)",
            "No se entregan los planos de instalaciones (eléctricos, hidráulicos, sanitarios, gas, otros)",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el sistema a utilizar de mampostería y el material utilizado como unidad de bloque describir en observaciones el tipo de bloque a utilizar (bloque de perforación vertical o bloque macizo entre otros)": {
          N2_opciones: [
            "El material no cumple con la especificación técnica de mampostería",
            "El sistema de mampostería no coincide con la especificado en las diseños estructurales",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    TRAZADO_DE_EJES_ESTRUCTURALES: {
      activities: {
        "Se validó la matriz de coincidencia entre los diseños estructurales y arquitectónicos con la localización en obra. Esta fase incluye la verificación del trazado de la cimbra, asegurando su correcta dimensión, escuadra y alineamiento. Además, este proceso será revisado y aprobado por el residente técnico y el maestro de obra, con especial atención a la holgura máxima permitida.": {
          N2_opciones: [
            "Hay modificación en dimensión y/o sección de los elementos",
            "No coincide las medidas de plano con las medidas en campo (dimensión, escuadra o alineamiento ) holgura máxima permitida 5mm",
            "Otra (agregar en observación)",
          ],
        },
        "Se valido el acero de arranque de muros sobre la sección del muro a armar (se debe validar piso a piso. No se admitirá ninguna holgura y se garantiza que el acero de arranque se ubique exactamente según las especificaciones detalladas en los planos. NO se permitirá el uso de grifada o doblez en los elementos verticales si estos se desalinean con la cimbra en cada piso. Para corregir esta situación, sedebe anclar una nueva varilla y ajustar su posición conforme a las especificaciones requeridas.": {
          N2_opciones: [
            "El acero no esta en la posición adecuada se sale de la cimbra",
            "El traslapo no cumple respecto a lo establecido en la norma",
            "Faltan elementos verticales de refuerzo",
            "Otra (agregar en observación)",
            "Se hace grifado o se hacen detalles diferentes a lo que presentan los planos estructurales",
          ],
        },
        "Se validó la sección del muro a armar piso a piso teniendo en cuenta sección del elemento y el acero de refuerzo": {
          N2_opciones: [
            "No esta acorde con la sección identificada en planos y afecta la espacialidad",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    ARMADO_DE_MAMPOSTERIA: {
      activities: {
        "Se valida la preparación del mortero en la primera hilada del muro. Se valida la especificación del mortero y de la resistencia de los bloques a compresión": {
          N2_opciones: [
            "El bloque no cumple con la resistencia a compresión",
            "El mortero no cumple con la especificación técnica",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida la instalación de la primera hilada revisando alineación horizontal y la disposición de aceros de arranque": {
          N2_opciones: [
            "No están definidos os aceros de arranque para las columnetas de amarre",
            "No hay alianeación en la primera hilada",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida plomo y alineación del muro. Por normativa el muro no debe sobrepasar 1.30 metros en una jornada de trabajo, por que el peso de las hiladas superiores comprimirá el mortero aun fresco de las hiladas inferiores, adelgazando las juntas horizontales y desalineando el muro.": {
          N2_opciones: [
            "El armado del muro en la jornada supera los 1.30 metros de altura puede generar desalineación del muro efectando su resistencia.",
            "No hay plomo ni alineación en el muro, no se cuenta con personal especializado en mampostería.",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la instalación de refuerzos horizontales cada tres hiladas con grafil o varilla según la especificación del diseñador estructural": {
          N2_opciones: [
            "No se instala grafil cada tres hiladas o según la separación indicada en los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    ARMADO_DE_COLUMNETAS_Y_VIGA_DE_AMARRE: {
      activities: {
        "Se valida el armado del acero de la columneta, garantizando que el acero se una al acero de la viga de confinamiento.Se validará acero de refuerzo de elementos verticales, estribos y traslapos": {
          N2_opciones: [
            "No cumple los aceros de refuerzo vertical del elemento en cuanto a diámetro",
            "No cumplen los ganchos de dobles (faltan ganchos, no cumplir con separación o cantidad de estribos)",
            "No cumplen los traslapos",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida el armado del acero de la viga de confinamiento. Se validará acero de refuerzo horizontal, estribos y traslapos. El acero de las vigas debe colocarse de manera tal que exista un recubrimiento mínimo de 25mm en todas las direcciones": {
          N2_opciones: [
            "No cumple los aceros de refuerzo horizontal del elemento en cuanto a diámetro",
            "No cumplen los ganchos de dobles (faltan ganchos, no cumplir con separación o cantidad de estribos)",
            "No cumplen los traslapos",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
    COLOCACION_DEL_CONCRETO: {
      activities: {
        "Se aprueba el inicio del vaciado al aprobar técnicamente las condicionantes anteriores. Se solicita el concreto de acuerdo al requerimiento del diseño estructural y teniendo en cuenta el uso de aditivos para mejorar permeabilidad, evolución de resistencia, fluidez entre otros.": {
          N2_opciones: [
            "El concreto no cumple con el requerimiento establecido en el diseño estructural",
            "No se cuenta con el personal suficiente para hacer la colocación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se valida la especificación del concreto": {
          N2_opciones: [
            "La especificación del concreto no coincide con los planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se Validó las condiciones de vaciado en cuanto a equipos de producción y transporte de concreto, personal y clima": {
          N2_opciones: [
            "El contratista no cuenta con el personal mínimo requerido para la colocación del concreto",
            "Las condiciones climáticas no permiten ejecutar el vaciado del concreto",
            "No hay condiciones del equipo de producción de concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el uso adecuado del vibrador y martillo de caucho. Es recomendable contar mínimo con dos vibradores en el sitio de vaciado": {
          N2_opciones: [
            "No hay personal capacitado para usar el vibrador",
            "No se cuenta con mínimo dos vibradores en el sitio de vaciado",
            "No se cuenta con personal para la labor de chipote",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el nivel de terminado del concreto después de fundido el elemento.": {
          N2_opciones: [
            "El nivel de terminado no está de acuerdo con el nivel marcado en planos estructurales",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó que se hizo toma de muestras en cilindros (en observaciones digitar número de cilindro de este elemento) N.S.R 2010. C.5.6.2 Frecuencia de los ensayos. C.5.6.2.1 Las muestras (véase C.5.6.2.4) para los ensayos de resistencia de cada clase de concreto, colocado cada día deben tomarse no menos de una vez al día, ni menos de una vez por cada 40 m3 de concreto, ni menos de una vez por cada 200 m2 de superficie de losas o muros. De igual manera, como mínimo, debe tomarse una muestra por cada 50 tandas de mezclado de cada clase de concreto": {
          N2_opciones: [
            "No se tomaron muestras de cilindros",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó el curado con agua (48 horas)": {
          N2_opciones: [
            "No se realizan acciones de curado del elemento y se ha ce un requerimiento inmediato",
            "Otra (agregar en observación)",
          ],
        },
        "Se valido que se desencofró la formaleta después de 10 horas de la fundida de los elementos y se hacen los resanes estructurales necesarios en las siguientes 12 horas de la colocación del concreto": {
          N2_opciones: [
            "No se hacen los resanes estructurales o se tardan mas de 12 horas para intervenirlos",
            "Otra (agregar en observación)",
            "Se retira la formaleta antes de 10 horas de la colocación del concreto",
          ],
        },
      },
    },
    INSTALACIONES: {
      activities: {
        "Se validó el resane con material de mortero o concreto si se requiere sobre las canchas realizadas para instalar las tuberías necesarias.": {
          N2_opciones: [
            "No se avanza con el proceso de resanes",
            "No se hacen los resanes con las especificaciones adecuadas",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la disposición de todas las instalaciones hidráulicas y sanitarias en los elementos de los muros. Se Verificó que el diámetro del tubo no exceda 1/3 del espesor del muro, conforme a la norma NSR-10, Título C.": {
          N2_opciones: [
            "Las instalaciones no cumplen con la disposición del trazado sobre los muros (en observaciones identificar el tipo de red: que no aplica con la especificación)",
            "No se cumple con el distanciamiento mínimo entre tuberías para evitar segregación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la disposición de todas las instalaciones eléctricas y de comunicaciones en los elementos de los muros. Se Verificó que el diámetro del tubo no exceda 1/3 del espesor del muro, conforme a la norma NSR-10, Título C.": {
          N2_opciones: [
            "Las instalaciones no cumplen con la disposición del trazado sobre los muros (en observaciones identificar el tipo de red: que no aplica con la especificación)",
            "No se cumple con el distanciamiento mínimo entre tuberías para evitar segregación del concreto",
            "Otra (agregar en observación)",
          ],
        },
        "Se validó la disposición de todas las instalaciones de gas en los elementos de los muros. Se Verificó que el diámetro del tubo no exceda 1/3 del espesor del muro, conforme a la norma NSR-10, Título C.": {
          N2_opciones: [
            "Las instalaciones no cumplen con la disposición del trazado sobre los muros (en observaciones identificar el tipo de red: que no aplica con la especificación)",
            "No se cumple con el distanciamiento mínimo entre tuberías para evitar segregación del concreto",
            "Otra (agregar en observación)",
          ],
        },
      },
    },
  },
};

// ---------------------------------------------------------------------
// DERIVADOS PARA SELECTS (Se mantienen)
// ---------------------------------------------------------------------
const TIPOS_TRABAJO = Object.keys(WORK_VALIDATION_MAP);
const TIPOS_TRABAJO_MAP = Object.fromEntries(
  TIPOS_TRABAJO.map((t) => [t, Object.keys(WORK_VALIDATION_MAP[t])])
);

const formatDisplay = (text: string) =>
  text.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// ---------------------------------------------------------------------
// Tipos de datos (Se mantienen)
// ---------------------------------------------------------------------
interface Obra {
  id: number;
  prefijo: string;
  nombre: string;
}
interface Responsable {
  nombreCompleto: string;
  username: string;
}
interface OrdenTrabajo {
  id: number;
  nOrden: string;
  identificacion: string | null;
  objetivo: string;
  tipoTrabajo: string;
  fecha: string;
  estado: string;
  obra: Obra;
  responsable: Responsable;
}

interface FormState {
  obraId: number | string;
  objetivo: string;
  tipoTrabajo: string;
  identificacion: string;
  fecha: Date | undefined;
  carpeta: string;
  actividad: string;
  estadoAc: "CUMPLE" | "NO_CUMPLE" | "NO_APLICA" | "";
  n2Opcion: string;
  observaciones: string;
  fotoFile: File | null;
}

const initialFormState: FormState = {
  obraId: "",
  objetivo: "",
  tipoTrabajo: "",
  identificacion: "",
  fecha: new Date(),
  carpeta: "",
  actividad: "",
  estadoAc: "",
  n2Opcion: "",
  observaciones: "",
  fotoFile: null,
};

// ---------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------
export default function OrdenTrabajoPage() {
  const [ots, setOts] = useState<OrdenTrabajo[]>([]);
  const [obras, setObras] = useState<Obra[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carga
  const fetchData = async () => {
    setLoading(true);
    try {
      const obrasRes = await apiGet<Obra[]>("/obras");
      setObras(obrasRes);
      const otsRes = await apiGet<OrdenTrabajo[]>("/orden-trabajo");
      setOts(otsRes);
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar datos de Obras u Órdenes de Trabajo.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
  }, []);

  // Dinámica: Actividades (Se mantiene la lógica)
  const actividadesList = useMemo(() => {
    if (form.tipoTrabajo && form.carpeta) {
      try {
        const tipo = WORK_VALIDATION_MAP[form.tipoTrabajo];
        // ⚠️ Se ajusta el acceso a 'activities' por si el usuario cambia el mapeo.
        const carpetaData = (tipo as any)?.[form.carpeta as keyof typeof tipo]?.activities; 
        if (carpetaData) {
          return Object.keys(carpetaData);
        }
      } catch {
        return [];
      }
    }
    return [];
  }, [form.tipoTrabajo, form.carpeta]);


  // Dinámica: N2 (Se mantiene la lógica)
  const n2Options = useMemo(() => {
    if (form.tipoTrabajo && form.carpeta && form.actividad) {
      try {
        const act =
          (WORK_VALIDATION_MAP as any)[form.tipoTrabajo][form.carpeta].activities[
            form.actividad
          ];
        return act?.N2_opciones || [];
      } catch {
        return [];
      }
    }
    return [];
  }, [form.tipoTrabajo, form.carpeta, form.actividad]);

  // Función para manejar los cambios de archivo (incluye validación)
  const handleFileChange = (file: File | null) => {
    // 1. Validar tipo de archivo
    if (file && !file.type.startsWith('image/')) {
      toast.error("El archivo debe ser una imagen.");
      setForm({ ...form, fotoFile: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    // 2. Validar tamaño de archivo (5MB límite)
    if (file && file.size > 5 * 1024 * 1024) {
      toast.error("La imagen no debe exceder 5MB.");
      setForm({ ...form, fotoFile: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setForm({ ...form, fotoFile: file });
  };

  // Lógica de Validación reforzada, especialmente para obraId.
  const validateForm = () => {
    setErrorMsg("");

    // 🚀 REFUERZO CLAVE: Validar explícitamente que Obra ID existe y es un número válido.
    if (!form.obraId || form.obraId === "" || isNaN(Number(form.obraId))) {
      setErrorMsg("Debe seleccionar una Obra válida.");
      return false;
    }

    // 2. El resto de campos obligatorios
    if (
      !form.objetivo ||
      !form.tipoTrabajo ||
      !form.fecha ||
      !form.carpeta ||
      !form.actividad ||
      !form.estadoAc
    ) {
      setErrorMsg(
        "Objetivo, Tipo de Trabajo, Carpeta, Actividad y Estado Ac son obligatorios."
      );
      return false;
    }
    
    // 3. Validación de N2 condicional
    if (form.estadoAc === "NO_CUMPLE" && n2Options.length > 0 && !form.n2Opcion) {
      setErrorMsg("Debe seleccionar una razón N2 si el Estado es NO CUMPLE.");
      return false;
    }
    
    // 4. Validación de longitud
    if (form.objetivo.length < 10) {
      setErrorMsg("El objetivo debe ser más descriptivo (mínimo 10 caracteres).");
      return false;
    }
    
    return true;
  };

// Archivo: frontend/src/app/(main)/obras/orden-trabajo/page.tsx (Extracto de handleSubmit)

// ... (asegúrate de que los imports de apiPost, toast, format, etc. estén arriba)
// ...


// En frontend/src/app/(main)/orden-trabajo/page.tsx (Función handleSubmit)

const handleSubmit = async () => {
    // Asumo que esta función verifica que Obra, Tipo de Trabajo, Carpeta, etc., no sean ""
    if (!validateForm()) return; 
    
    setLoading(true);

    // 1. Crear el JSON de datos (sin el archivo, solo texto/metadata)
    const textPayload = {
      // Aseguramos que los valores de SELECTS sean string antes de trim 
      // El valor (form.campo || "") previene que sea null/undefined.
      obraId: form.obraId as string,
      
      objetivo: form.objetivo.trim(),
      tipoTrabajo: (form.tipoTrabajo || "").trim(), 
      carpeta: (form.carpeta || "").trim(),
      actividad: (form.actividad || "").trim(),
      estadoActividad: (form.estadoAc || "").trim(), 
      
      fecha: form.fecha ? format(form.fecha, "yyyy-MM-dd") : null,
      
      // Campos opcionales con chequeo de null
      identificacion: form.identificacion ? form.identificacion.trim() : null,
      n2Opcion: form.n2Opcion ? form.n2Opcion.trim() : null,
      observaciones: form.observaciones ? form.observaciones.trim() : null,
    };

    // 2. Crear el objeto FormData
    const formData = new FormData();
    
    // CRÍTICO: Añadir el JSON con la clave 'data' que ParseJsonPipe espera
    formData.append("data", JSON.stringify(textPayload)); 

    // Añadir el archivo, si existe
    if (form.fotoFile) { 
      formData.append("foto", form.fotoFile); 
    }

    try {
      if (editingId) {
        // Lógica para actualizar (PATCH)
        await apiPatch(`/orden-trabajo/${editingId}`, formData, {
          headers: {
              'Content-Type': undefined, // 🚀 CORRECCIÓN CRÍTICA
          }
        });
        toast.success("✅ Orden de Trabajo actualizada.");
      } else {
        // Lógica para crear (POST)
        await apiPost("/orden-trabajo", formData, {
          // ✅ SOLUCIÓN FINAL: Permite que el navegador establezca el Content-Type con el boundary
          headers: {
              'Content-Type': undefined, // <-- Esto soluciona el 400 por error de cabeceras
          }
        });
        toast.success("✅ Orden de Trabajo guardada.");
      }

      setDialogOpen(false); 
      loadOrdenesTrabajo(); 
      
    } catch (error: any) {
      console.error(error);
      let errorMessage = "Ocurrió un error al guardar la orden de trabajo.";
      
      // Capturamos el error detallado del ValidationPipe (si es que existe)
      if (error.response && error.response.data) {
        const messages = error.response.data.message;
        if (Array.isArray(messages)) {
          errorMessage = "❌ Fallo al guardar OT: " + messages.join(' | ');
        } else {
          errorMessage = `❌ Fallo al guardar OT: ${messages}`;
        }
      } else if (error.message) {
         errorMessage = `❌ Fallo de red: ${error.message}`;
      }
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
};
  

  // Filtros / Tabla
  const filteredOts = useMemo(
    () =>
      ots.filter((ot) =>
        [ot.nOrden, ot.identificacion ?? "", ot.obra.nombre, ot.tipoTrabajo]
          .join(" ")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      ),
    [ots, searchTerm]
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "FINALIZADA":
        return "bg-green-100 text-green-700";
      case "EN_PROCESO":
        return "bg-blue-100 text-blue-700";
      case "APROBADA":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  const handleOpenRegister = () => {
    setEditingId(null);
    setForm({ ...initialFormState, fecha: new Date() });
    setErrorMsg("");
    setOpen(true);
  };

  const openEditModal = (ot: OrdenTrabajo) =>
    toast.info(`Abriendo Gestión OT para: ${ot.nOrden}.`);

  const handleDelete = async (id: number, nOrden: string) => {
    if (!confirm(`¿Está seguro de eliminar la Orden de Trabajo ${nOrden}?`)) return;
    setLoading(true);
    try {
      await apiDelete(`/orden-trabajo/${id}`);
      toast.success(`🗑️ Orden de Trabajo ${nOrden} eliminada.`);
      fetchData();
    } catch {
      toast.error("No se pudo eliminar la OT. Verifique dependencias.");
    } finally {
      setLoading(false);
    }
  };

  // Render
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#0C2D57]">Órdenes de Trabajo (OT)</h1>
        <Button onClick={handleOpenRegister} className="bg-[#0C2D57] hover:bg-[#113a84]">
          + Nueva Identificación
        </Button>
      </div>

      {/* Buscador */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por N. Orden, Obra o Tipo de Trabajo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        {loading && <p className="text-sm text-gray-500">Cargando...</p>}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
        <Table>
          <TableHeader className="bg-gray-100">
            <TableRow>
              <TableHead className="w-[100px] text-[#0C2D57]">N. Orden</TableHead>
              <TableHead className="text-[#0C2D57]">Obra</TableHead>
              <TableHead className="text-[#0C2D57]">Tipo Trabajo</TableHead>
              <TableHead className="text-[#0C2D57]">Identificación</TableHead>
              <TableHead className="text-[#0C2D57]">Responsable</TableHead>
              <TableHead className="text-[#0C2D57]">Fecha</TableHead>
              <TableHead className="text-[#0C2D57]">Estado</TableHead>
              <TableHead className="w-[120px] text-center text-[#0C2D57]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No se encontraron Órdenes de Trabajo.
                </TableCell>
              </TableRow>
            ) : (
              filteredOts.map((ot) => (
                <TableRow key={ot.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="font-medium text-[#0C2D57]">{ot.nOrden}</TableCell>
                  <TableCell>
                    {ot.obra.prefijo} - {ot.obra.nombre}
                  </TableCell>
                  <TableCell>{formatDisplay(ot.tipoTrabajo)}</TableCell>
                  <TableCell>{ot.identificacion || "-"}</TableCell>
                  <TableCell>{ot.responsable.nombreCompleto || ot.responsable.username}</TableCell>
                  <TableCell>{format(new Date(ot.fecha), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-semibold ${getEstadoColor(
                        ot.estado
                      )}`}
                    >
                      {ot.estado.replace("_", " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openEditModal(ot)}
                        className="text-gray-600 hover:bg-gray-100 border-gray-300"
                        title="Gestionar OT"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(ot.id, ot.nOrden)}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Gestionar OT" : "Nueva Identificación"}</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {/* Obra */}
            <div>
              <label className="text-sm font-medium">Obra *</label>
              <Select
                value={form.obraId as string}
                onValueChange={(v) => setForm({ ...form, obraId: v })}
                disabled={obras.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione la Obra" />
                </SelectTrigger>
                <SelectContent>
                  {obras.map((obra) => (
                    // 🚀 CORRECCIÓN CLAVE: Usar obra.id como valor (v), no el nombre.
                    <SelectItem key={obra.id} value={obra.id.toString()}>
                      {obra.prefijo} - {obra.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Objetivo */}
            <div>
              <label className="text-sm font-medium">Objetivo del formulario *</label>
              <Textarea
                placeholder="Describe el objetivo de esta Orden de Trabajo."
                value={form.objetivo}
                onChange={(e) => setForm({ ...form, objetivo: e.target.value })}
                rows={3}
                required
              />
            </div>

            {/* Tipo / Identificación / Fecha */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo de Trabajo *</label>
                <Select
                  value={form.tipoTrabajo}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      tipoTrabajo: v,
                      carpeta: "",
                      actividad: "",
                      estadoAc: "",
                      n2Opcion: "",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_TRABAJO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {formatDisplay(tipo)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Identificación / N. Orden Manual"
                value={form.identificacion}
                onChange={(e) => setForm({ ...form, identificacion: e.target.value })}
                className="mt-5"
              />

              <div>
                <label className="text-sm font-medium">Fecha *</label>
                <Input
                  type="date"
                  value={form.fecha ? format(form.fecha, "yyyy-MM-dd") : ""}
                  onChange={(e) => setForm({ ...form, fecha: new Date(e.target.value) })}
                  required
                />
              </div>
            </div>

            {/* Carpeta / Actividad */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Carpeta *</label>
                <Select
                  value={form.carpeta}
                  onValueChange={(v) =>
                    setForm({ ...form, carpeta: v, actividad: "", estadoAc: "", n2Opcion: "" })
                  }
                  disabled={!form.tipoTrabajo}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione Carpeta" />
                  </SelectTrigger>
                  <SelectContent>
                    {form.tipoTrabajo &&
                      TIPOS_TRABAJO_MAP[form.tipoTrabajo]?.map((carpeta) => (
                        <SelectItem key={carpeta} value={carpeta}>
                          {formatDisplay(carpeta)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Actividad *</label>
                <Select
                  value={form.actividad}
                  onValueChange={(v) => setForm({ ...form, actividad: v, estadoAc: "", n2Opcion: "" })}
                  disabled={!form.tipoTrabajo || !form.carpeta}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione Actividad" />
                  </SelectTrigger>
                  <SelectContent>
                    {actividadesList.map((actividad) => (
                      <SelectItem key={actividad} value={actividad}>
                        {actividad.length > 70 ? actividad.substring(0, 70) + "..." : actividad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Estado de Actividad + N2 */}
            <div className="grid grid-cols-3 gap-4 border p-4 rounded-md bg-gray-50">
              {/* Estado Ac como SELECT */}
              <div>
                <label className="text-sm font-medium">Estado Ac *</label>
                <Select
                  value={form.estadoAc}
                  onValueChange={(v) =>
                    setForm({ ...form, estadoAc: v as FormState["estadoAc"], n2Opcion: "" })
                  }
                  disabled={!form.actividad}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUMPLE">CUMPLE</SelectItem>
                    <SelectItem value="NO_CUMPLE">NO CUMPLE</SelectItem>
                    <SelectItem value="NO_APLICA">NO APLICA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* N2 condicional */}
              {form.estadoAc === "NO_CUMPLE" && n2Options.length > 0 ? (
                <div className="col-span-2">
                  <label className="text-sm font-medium text-red-600">
                    N2 Opciones (Razón No Cumplimiento) *
                  </label>
                  <Select
                    value={form.n2Opcion}
                    onValueChange={(v) => setForm({ ...form, n2Opcion: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione la causa de No Cumplimiento" />
                    </SelectTrigger>
                    <SelectContent>
                      {n2Options.map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                          {opcion.length > 80 ? opcion.substring(0, 80) + "..." : opcion}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.n2Opcion?.includes("Otra") && (
                    <p className="text-xs text-orange-500 mt-1">
                      Por favor, detalle la razón en el campo "Observaciones".
                    </p>
                  )}
                </div>
              ) : (
                <div className="col-span-2 flex items-center justify-center text-sm text-gray-400">
                  <p>Seleccione “NO CUMPLE” y una actividad para ver las opciones N2.</p>
                </div>
              )}
            </div>

            {/* Observaciones + Foto 1 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Observaciones</label>
                <Textarea
                  placeholder="Observaciones adicionales, detalles de N2 (si seleccionó 'Otra'), etc."
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Renderizado del Campo de Foto con lógica de subida y drag-and-drop */}
              <div className="flex flex-col">
                <label className="text-sm font-medium">Foto 1</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                  className="hidden" // Ocultar el input nativo
                />
                {/* Visualización y manejo de interacciones */}
                <div
                  className={`flex-1 border-2 border-dashed rounded-md p-4 flex flex-col items-center justify-center text-gray-500 mt-1 cursor-pointer transition-colors h-full min-h-[100px] ${
                    form.fotoFile
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                  onClick={() => fileInputRef.current?.click()} // Abre el selector al hacer clic
                  // Manejo básico de Drag and Drop
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-blue-700'); }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-blue-700'); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove('border-blue-700');
                    const file = e.dataTransfer.files[0];
                    handleFileChange(file);
                  }}
                >
                  {form.fotoFile ? (
                    <span className="text-green-700 font-medium text-center">
                      ✅ Archivo cargado: **{form.fotoFile.name}**
                    </span>
                  ) : (
                    <>
                      Haga clic para cargar o arrastrar un archivo y soltarlo aquí
                      <Upload className="h-5 w-5 ml-2 mt-1 text-gray-400" />
                    </>
                  )}
                </div>
                {form.fotoFile && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => handleFileChange(null)}
                    className="text-red-500 p-0 h-auto self-start mt-1"
                  >
                    Eliminar foto
                  </Button>
                )}
              </div>
              {/* FIN Renderizado de Foto */}
            </div>

            {errorMsg && <p className="text-sm text-red-500 text-center mt-2">{errorMsg}</p>}

            <Button onClick={handleSubmit} disabled={loading} className="mt-4 bg-[#0C2D57] hover:bg-[#113a84]">
              {loading ? (editingId ? "Guardando..." : "Guardando...") : (editingId ? "Actualizar" : "Agregar")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
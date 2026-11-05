<?php

namespace App\Enums;

enum WasteCategory: string
{
    case Organic = 'organic';
    case Plastic = 'plastic';
    case Paper = 'paper';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}

import { useState, useEffect, useCallback, useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox"
import { countries } from "@/data/countries"
import { provinces as provinceList } from "@/data/wilayah/provinces"
import { loadProvinceData, type WilayahEntry } from "@/data/wilayah"
import { useTranslation } from "@/i18n"

interface AddressValues {
  city: string
  kecamatan: string
  state: string
  postalCode: string
  country: string
}

interface AddressFieldsProps {
  values: AddressValues
  onChange: (updates: Partial<AddressValues>) => void
  stateLabel?: string
  cityPlaceholder?: string
  statePlaceholder?: string
}

// Stable references for items arrays (avoid re-creating on each render)
const countriesArray = [...countries]
const provincesArray = provinceList.map((p) => p.nama)

export function AddressFields({
  values,
  onChange,
  stateLabel,
  cityPlaceholder,
  statePlaceholder,
}: AddressFieldsProps) {
  const { t } = useTranslation()
  const isIndonesia = values.country === "Indonesia"
  const [kabupatenList, setKabupatenList] = useState<WilayahEntry[]>([])
  const [allKecamatanList, setAllKecamatanList] = useState<WilayahEntry[]>([])
  const [loadingKab, setLoadingKab] = useState(false)

  // Find the selected province code from the province name
  const selectedProvince = provinceList.find((p) => p.nama === values.state)

  // Find the selected kabupaten entry from the kabupaten name
  const selectedKabupaten = kabupatenList.find((k) => k.nama === values.city)

  // Filter kecamatan by selected kabupaten code prefix
  const kecamatanList = useMemo(() => {
    if (!selectedKabupaten) return []
    const prefix = selectedKabupaten.kode + "."
    return allKecamatanList.filter((k) => k.kode.startsWith(prefix))
  }, [selectedKabupaten, allKecamatanList])

  // Stable string arrays for Combobox items prop
  const kabupatenNames = useMemo(
    () => kabupatenList.map((k) => k.nama),
    [kabupatenList]
  )
  const kecamatanNames = useMemo(
    () => kecamatanList.map((k) => k.nama),
    [kecamatanList]
  )

  // Load kabupaten + kecamatan when province changes
  useEffect(() => {
    if (!isIndonesia || !selectedProvince) {
      setKabupatenList([])
      setAllKecamatanList([])
      return
    }

    let cancelled = false
    setLoadingKab(true)

    loadProvinceData(selectedProvince.kode).then((data) => {
      if (!cancelled) {
        setKabupatenList(data.kabupaten)
        setAllKecamatanList(data.kecamatan)
        setLoadingKab(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [isIndonesia, selectedProvince?.kode])

  const handleCountryChange = useCallback(
    (value: string | null) => {
      const newCountry = value ?? ""
      if (newCountry !== values.country) {
        onChange({
          country: newCountry,
          state: "",
          city: "",
          kecamatan: "",
          postalCode: "",
        })
      }
    },
    [values.country, onChange]
  )

  const handleProvinceChange = useCallback(
    (value: string | null) => {
      const newState = value ?? ""
      if (newState !== values.state) {
        onChange({
          state: newState,
          city: "",
          kecamatan: "",
          postalCode: "",
        })
      }
    },
    [values.state, onChange]
  )

  const handleKabupatenChange = useCallback(
    (value: string | null) => {
      const newCity = value ?? ""
      if (newCity !== values.city) {
        onChange({
          city: newCity,
          kecamatan: "",
          postalCode: "",
        })
      }
    },
    [values.city, onChange]
  )

  const handleKecamatanChange = useCallback(
    (value: string | null) => {
      onChange({ kecamatan: value ?? "" })
    },
    [onChange]
  )

  return (
    <div
      className={
        isIndonesia
          ? "grid grid-cols-2 gap-3 lg:grid-cols-5"
          : "grid grid-cols-2 gap-3 lg:grid-cols-4"
      }
    >
      {/* Country */}
      <div className="space-y-1.5">
        <Label>{t("form.country")}</Label>
        <Combobox
          value={values.country || null}
          onValueChange={handleCountryChange}
          items={countriesArray}
          autoComplete="one-time-code"
        >
          <ComboboxInput
            placeholder={t("placeholders.searchCountry")}
            className="w-full"
          />
          <ComboboxContent>
            <ComboboxList>
              {(item: string) => (
                <ComboboxItem key={item} value={item}>
                  {item}
                </ComboboxItem>
              )}
            </ComboboxList>
            <ComboboxEmpty>{t("placeholders.noResults")}</ComboboxEmpty>
          </ComboboxContent>
        </Combobox>
      </div>

      {/* State/Region (Province for Indonesia) */}
      <div className="space-y-1.5">
        <Label>{stateLabel ?? t("form.stateRegion")}</Label>
        {isIndonesia ? (
          <Combobox
            value={values.state || null}
            onValueChange={handleProvinceChange}
            items={provincesArray}
            autoComplete="one-time-code"
          >
            <ComboboxInput
              placeholder={t("placeholders.searchProvince")}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>{t("placeholders.noResults")}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        ) : (
          <Input
            autoComplete="one-time-code"
            placeholder={statePlaceholder}
            value={values.state}
            onChange={(e) => onChange({ state: e.target.value })}
          />
        )}
      </div>

      {/* City (Kabupaten/Kota for Indonesia) */}
      <div className="space-y-1.5">
        <Label>{t("form.city")}</Label>
        {isIndonesia ? (
          <Combobox
            value={values.city || null}
            onValueChange={handleKabupatenChange}
            items={kabupatenNames}
            autoComplete="one-time-code"
          >
            <ComboboxInput
              placeholder={
                !selectedProvince
                  ? t("placeholders.selectProvinceFirst")
                  : loadingKab
                    ? t("placeholders.loading")
                    : t("placeholders.searchKabupaten")
              }
              disabled={!selectedProvince || loadingKab}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>{t("placeholders.noResults")}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        ) : (
          <Input
            autoComplete="one-time-code"
            placeholder={cityPlaceholder}
            value={values.city}
            onChange={(e) => onChange({ city: e.target.value })}
          />
        )}
      </div>

      {/* Kecamatan (Indonesia only) */}
      {isIndonesia && (
        <div className="space-y-1.5">
          <Label>{t("form.kecamatan")}</Label>
          <Combobox
            value={values.kecamatan || null}
            onValueChange={handleKecamatanChange}
            items={kecamatanNames}
            autoComplete="one-time-code"
          >
            <ComboboxInput
              placeholder={
                !selectedProvince
                  ? t("placeholders.selectProvinceFirst")
                  : !selectedKabupaten
                    ? t("placeholders.selectKabupatenFirst")
                    : t("placeholders.searchKecamatan")
              }
              disabled={!selectedKabupaten}
              className="w-full"
            />
            <ComboboxContent>
              <ComboboxList>
                {(item: string) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
              <ComboboxEmpty>{t("placeholders.noResults")}</ComboboxEmpty>
            </ComboboxContent>
          </Combobox>
        </div>
      )}

      {/* Postal Code */}
      <div className="space-y-1.5">
        <Label>{t("form.postalCode")}</Label>
        <Input
          autoComplete="one-time-code"
          placeholder={t("placeholders.postalCode")}
          value={values.postalCode}
          onChange={(e) => onChange({ postalCode: e.target.value })}
        />
      </div>
    </div>
  )
}

import { useEffect, useState, useRef } from 'react'
import {
  YMaps,
  Map,
  GeolocationControl,
  ZoomControl,
} from '@pbe/react-yandex-maps'
import axios from 'axios'
import { Box } from '@chakra-ui/react'
import Marker from './Marker'

interface YandexMapProps {
  onLocationChange: (e: {
    address: string
    city: string
    location: [number, number]
  }) => void
}

const YandexMap: React.FC<YandexMapProps> = ({ onLocationChange }) => {
  const [isLoading, setLoading] = useState(false)
  const [isDragging, setDragging] = useState(false)

  const onBoundsChange = (e: any) => {
    const coords = e.originalEvent.newCenter
    setDragging(false)

    getAddress([coords[1], coords[0]])

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 2000)
  }

  const getAddress = async (coords: [number, number]) => {
    try {
      const response = await axios.get(
        `https://geocode-maps.yandex.ru/1.x/?apikey=${
          process.env.NEXT_PUBLIC_YANDEX_API_KEY
        }&geocode=${String(coords)}&lang=ru_RU&format=json`
      )

      if (response?.data) {
        const geoObject =
          response?.data?.response?.GeoObjectCollection?.featureMember[0]
            ?.GeoObject
        let city = ''
        if (geoObject.metaDataProperty?.GeocoderMetaData?.Address?.Components) {
          for (const item of geoObject.metaDataProperty?.GeocoderMetaData
            ?.Address?.Components) {
            if (item.kind === 'locality') {
              city = item.name
            }
          }
        }
        onLocationChange({
          address: geoObject?.name,
          city,
          location: coords,
        })
      }
    } catch (error: any) {
      console.log(error?.data?.message)
    }
  }

  return (
    <Box position="relative" zIndex={1}>
      <Marker hover={isDragging} isLoading={isLoading} />
      <YMaps query={{ apikey: process.env.NEXT_PUBLIC_YANDEX_API_KEY }}>
        <Map
          className="map"
          onMouseDown={() => setDragging(true)}
          defaultState={{ center: [41.314472, 69.27991], zoom: 14 }}
          onBoundsChange={onBoundsChange}
          options={{
            copyrightLogoVisible: false,
            copyrightProvidersVisible: false,
            copyrightUaVisible: false,
            avoidFractionalZoom: true,
            suppressMapOpenBlock: true,
          }}
        >
          <ZoomControl />
          <GeolocationControl />
        </Map>
      </YMaps>
    </Box>
  )
}

export default YandexMap

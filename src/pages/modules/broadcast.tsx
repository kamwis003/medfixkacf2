import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { apiRequest } from '@/utils/api'
import { useToast } from '@/hooks/use-toast'
import { Mail, Users, Search } from 'lucide-react'

interface IPatientProfile {
  id: string
  firstName: string
  lastName: string
}

const MAX_SUBJECT_LENGTH = 255

interface IPatientsListResponse {
  data: IPatientProfile[]
}

export const BroadcastPage: React.FC = () => {
  const { t } = useTranslation()
  const { toast } = useToast()

  const [patients, setPatients] = React.useState<IPatientProfile[]>([])
  const [isLoadingPatients, setIsLoadingPatients] = React.useState(true)
  const [loadError, setLoadError] = React.useState<string | null>(null)

  const [search, setSearch] = React.useState('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())

  const [subject, setSubject] = React.useState('')
  const [body, setBody] = React.useState('')

  const [isSending, setIsSending] = React.useState(false)

  React.useEffect(() => {
    setIsLoadingPatients(true)
    apiRequest<IPatientsListResponse>('/patients')
      .then(data => {
        setPatients(data.data ?? [])
      })
      .catch(e => {
        setLoadError(e.message || t('broadcast.errors.loadPatients'))
      })
      .finally(() => setIsLoadingPatients(false))
  }, [t])

  const normalize = (s: string) =>
    s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

  const filteredPatients = patients.filter(
    p =>
      !search ||
      normalize(p.firstName).includes(normalize(search)) ||
      normalize(p.lastName).includes(normalize(search))
  )

  const allFilteredSelected =
    filteredPatients.length > 0 &&
    filteredPatients.every(p => selectedIds.has(p.id))

  const handleToggleAll = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allFilteredSelected) {
        filteredPatients.forEach(p => next.delete(p.id))
      } else {
        filteredPatients.forEach(p => next.add(p.id))
      }
      return next
    })
  }

  const handleTogglePatient = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const canSend = selectedIds.size > 0 && subject.trim().length > 0 && body.trim().length > 0

  const handleSend = async () => {
    if (!canSend) return
    setIsSending(true)
    try {
      await apiRequest('/broadcast', {
        method: 'POST',
        body: JSON.stringify({
          patientIds: Array.from(selectedIds),
          subject: subject.trim(),
          body: body.trim(),
        }),
      })
      toast({
        title: t('broadcast.success.title'),
        description: t('broadcast.success.description', { count: selectedIds.size }),
      })
      setSubject('')
      setBody('')
      setSelectedIds(new Set())
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('broadcast.errors.send')
      toast({
        title: t('broadcast.errors.sendTitle'),
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-3">
        <Mail className="size-7 text-primary" />
        <h1 className="text-3xl font-bold">{t('broadcast.title')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patient selection panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5" />
              {t('broadcast.patients.title')}
            </CardTitle>
            <CardDescription>{t('broadcast.patients.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('patients.search')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {isLoadingPatients ? (
              <div className="text-center text-muted-foreground py-8">{t('patients.loading')}</div>
            ) : loadError ? (
              <Alert variant="destructive">
                <AlertDescription>{loadError}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {t('broadcast.patients.selected', { count: selectedIds.size })}
                  </span>
                  {filteredPatients.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={handleToggleAll}>
                      {allFilteredSelected
                        ? t('broadcast.patients.deselectAll')
                        : t('broadcast.patients.selectAll')}
                    </Button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto rounded-md border">
                  {filteredPatients.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      {t('patients.noMatches')}
                    </p>
                  ) : (
                    <ul className="divide-y">
                      {filteredPatients.map(p => (
                        <li
                          key={p.id}
                          className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
                          onClick={() => handleTogglePatient(p.id)}
                        >
                          <Checkbox
                            id={`patient-${p.id}`}
                            checked={selectedIds.has(p.id)}
                            onCheckedChange={() => handleTogglePatient(p.id)}
                            onClick={e => e.stopPropagation()}
                          />
                          <label
                            htmlFor={`patient-${p.id}`}
                            className="flex-1 cursor-pointer text-sm"
                          >
                            {p.firstName} {p.lastName}
                          </label>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Message composition panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="size-5" />
              {t('broadcast.message.title')}
            </CardTitle>
            <CardDescription>{t('broadcast.message.description')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="broadcast-subject">{t('broadcast.message.subject')}</Label>
              <Input
                id="broadcast-subject"
                placeholder={t('broadcast.message.subjectPlaceholder')}
                value={subject}
                onChange={e => setSubject(e.target.value)}
                maxLength={MAX_SUBJECT_LENGTH}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="broadcast-body">{t('broadcast.message.body')}</Label>
              <Textarea
                id="broadcast-body"
                placeholder={t('broadcast.message.bodyPlaceholder')}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="min-h-48 resize-y"
              />
            </div>

            {selectedIds.size === 0 && (
              <Alert>
                <AlertDescription>{t('broadcast.message.noRecipientsHint')}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleSend}
              disabled={!canSend || isSending}
              className="w-full"
            >
              {isSending
                ? t('broadcast.message.sending')
                : t('broadcast.message.send', { count: selectedIds.size })}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Brain } from 'lucide-react';
import { API_BASE_URL } from "@/lib/api";

interface Entity {
  name: string;
  type: string;
  first_mentioned: number;
  last_mentioned: number;
  mention_count: number;
  context: string;
  aliases: string[];
}

interface EntityTrackerProps {
  threadId: string;
  orgId: string;
}

export function EntityTracker({ threadId, orgId }: EntityTrackerProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (threadId && orgId) {
      fetchEntities();
    }
  }, [threadId, orgId]);

  const fetchEntities = async () => {
    if (!threadId || !orgId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/threads/${threadId}/entities`, {
        headers: {
          'x-org-id': orgId,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEntities(data.entities || []);
      }
    } catch (error) {
      console.error('Failed to fetch entities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getEntityColor = (type: string): string => {
    const colors: Record<string, string> = {
      person: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      university: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      model: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      company: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      product: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
      location: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      concept: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      organization: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    };
    return colors[type.toLowerCase()] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const groupedEntities = entities.reduce((acc, entity) => {
    if (!acc[entity.type]) {
      acc[entity.type] = [];
    }
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<string, Entity[]>);

  if (entities.length === 0) {
    return null;
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <Card className="w-full">
        <CollapsibleTrigger className="w-full">
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Context Awareness</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {entities.length} {entities.length === 1 ? 'entity' : 'entities'}
                </Badge>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
            <CardDescription className="text-left">
              Entities Syntra is tracking in this conversation
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {Object.entries(groupedEntities)
                  .sort(([, a], [, b]) => b.length - a.length)
                  .map(([type, typeEntities]) => (
                    <div key={type} className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                        {type}s ({typeEntities.length})
                      </h4>
                      <div className="space-y-2">
                        {typeEntities
                          .sort((a, b) => b.last_mentioned - a.last_mentioned)
                          .map((entity, index) => (
                            <div
                              key={`${entity.name}-${index}`}
                              className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{entity.name}</span>
                                  <Badge className={getEntityColor(entity.type)} variant="secondary">
                                    {entity.type}
                                  </Badge>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {entity.mention_count} {entity.mention_count === 1 ? 'mention' : 'mentions'}
                                </Badge>
                              </div>

                              {entity.context && (
                                <p className="text-sm text-muted-foreground mb-2">{entity.context}</p>
                              )}

                              {entity.aliases && entity.aliases.length > 0 && (
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {entity.aliases.map((alias, aliasIndex) => (
                                    <Badge key={aliasIndex} variant="outline" className="text-xs">
                                      {alias}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="text-xs text-muted-foreground">
                                Last mentioned: {formatTimestamp(entity.last_mentioned)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
